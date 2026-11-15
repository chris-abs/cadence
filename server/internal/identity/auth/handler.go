package auth

import (
	"net/http"
	"net/netip"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/identity/family"
	"github.com/chris-abs/cadence/server/internal/identity/profile"
	"github.com/chris-abs/cadence/server/internal/middleware"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

type Handler struct {
	svc     *Service
	cookies middleware.Cookies
	proxies []netip.Prefix
}

func NewHandler(svc *Service, cookies middleware.Cookies, proxies []netip.Prefix) *Handler {
	return &Handler{svc: svc, cookies: cookies, proxies: proxies}
}

func (h *Handler) RegistrationStatus(w http.ResponseWriter, r *http.Request) error {
	open, err := h.svc.RegistrationOpen(r.Context())
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, api.RegistrationStatus{Open: open})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) error {
	var body api.RegisterRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	current, _ := h.cookies.Read(r)
	out, err := h.svc.Register(r.Context(), RegisterInput{
		Email: body.Email, Password: body.Password, FamilyName: body.FamilyName,
		OwnerName: body.Owner.Name, OwnerColour: string(body.Owner.Colour), OwnerTimezone: body.Owner.Timezone,
		OwnerAvatar: body.Owner.Avatar, DeviceName: body.DeviceName,
		UserAgent: r.UserAgent(), ClientIP: httpx.ClientIP(r, h.proxies), CurrentDeviceToken: current,
	})
	if err != nil {
		return err
	}
	me, err := h.svc.Me(r.Context(), out.Caller, out.Profile, out.Family)
	if err != nil {
		return err
	}
	h.cookies.SetFamily(w, out.FamilyToken, FamilyAbsoluteTimeout)
	h.cookies.SetProfile(w, out.ProfileToken, ProfileAbsoluteTimeout)
	return httpx.WriteJSON(w, http.StatusCreated, meView(me))
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) error {
	var body api.LoginRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	current, _ := h.cookies.Read(r)
	out, err := h.svc.Login(r.Context(), LoginInput{
		Email: body.Email, Password: body.Password, DeviceName: body.DeviceName,
		UserAgent: r.UserAgent(), ClientIP: httpx.ClientIP(r, h.proxies), CurrentDeviceToken: current,
	})
	if err != nil {
		return err
	}
	h.cookies.SetFamily(w, out.Token, FamilyAbsoluteTimeout)
	h.cookies.ClearProfile(w)
	return httpx.WriteJSON(w, http.StatusOK, api.FamilySession{
		Family: family.SummaryView(out.Family), Profiles: profile.SummaryViews(out.Profiles),
	})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) error {
	fs, _ := h.cookies.Read(r)
	if err := h.svc.Logout(r.Context(), fs); err != nil {
		return err
	}
	h.cookies.ClearBoth(w)
	return httpx.NoContent(w)
}

func (h *Handler) FamilySession(w http.ResponseWriter, r *http.Request) error {
	f, profiles, err := h.svc.FamilySession(r.Context(), models.DeviceFrom(r.Context()))
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, api.FamilySession{
		Family: family.SummaryView(f), Profiles: profile.SummaryViews(profiles),
	})
}

func (h *Handler) SelectProfile(w http.ResponseWriter, r *http.Request) error {
	var body api.SelectProfileRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	id, err := uuid.Parse(body.ProfileId)
	if err != nil {
		return models.Invalid("profileId", "Choose a profile.")
	}
	out, err := h.svc.SelectProfile(r.Context(), models.DeviceFrom(r.Context()), id, body.Pin)
	if err != nil {
		return err
	}
	me, err := h.svc.Me(r.Context(), out.Caller, out.Profile, out.Family)
	if err != nil {
		return err
	}
	h.cookies.SetProfile(w, out.ProfileToken, ProfileAbsoluteTimeout)
	return httpx.WriteJSON(w, http.StatusOK, meView(me))
}

func (h *Handler) Lock(w http.ResponseWriter, r *http.Request) error {
	if err := h.svc.Lock(r.Context(), models.DeviceFrom(r.Context())); err != nil {
		return err
	}
	h.cookies.ClearProfile(w)
	return httpx.NoContent(w)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	p, _ := profile.FromContext(r.Context())
	f, _ := family.FromContext(r.Context())
	me, err := h.svc.Me(r.Context(), caller, p, f)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, meView(me))
}

func (h *Handler) Devices(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	devices, err := h.svc.Devices(r.Context(), caller)
	if err != nil {
		return err
	}
	sessions := make([]api.DeviceSession, len(devices))
	for i, d := range devices {
		sessions[i] = api.DeviceSession{
			Id: d.ID.String(), DeviceName: d.DeviceName, UserAgent: d.UserAgent,
			CreatedAt: d.CreatedAt, LastSeenAt: d.LastSeenAt, Current: d.Current, ActiveProfileName: d.ActiveProfileName,
		}
		if d.ActiveProfileID != nil {
			id := d.ActiveProfileID.String()
			sessions[i].ActiveProfileId = &id
		}
	}
	return httpx.WriteJSON(w, http.StatusOK, api.DeviceSessionList{Sessions: sessions})
}

func (h *Handler) RevokeDevice(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := uuid.Parse(r.PathValue("sessionId"))
	if err != nil {
		return models.ErrNotFound
	}
	current, err := h.svc.RevokeDevice(r.Context(), caller, id)
	if err != nil {
		return err
	}
	if current {
		h.cookies.ClearBoth(w)
	}
	return httpx.NoContent(w)
}

func (h *Handler) RevokeOtherDevices(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	if err := h.svc.RevokeOtherDevices(r.Context(), caller); err != nil {
		return err
	}
	return httpx.NoContent(w)
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.ChangePasswordRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	if err := h.svc.ChangePassword(r.Context(), caller, body.CurrentPassword, body.NewPassword); err != nil {
		return err
	}
	return httpx.NoContent(w)
}

func meView(m Me) api.Me {
	modules := make([]api.Module, len(m.Caller.Modules))
	for i, mod := range m.Caller.Modules {
		modules[i] = family.ModuleView(mod, true)
	}
	return api.Me{
		Profile:     profile.View(m.Profile, m.Caller),
		Family:      family.SummaryView(m.Family),
		Permissions: m.Caller.Permissions,
		Modules:     modules,
		PinAdvised:  m.PinAdvised,
		Session:     api.ProfileSessionInfo{ExpiresAt: m.Caller.ExpiresAt, IdleTimeoutSeconds: int(ProfileIdleTimeout.Seconds())},
	}
}
