package identity

import (
	"net/http"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

func (h *Handler) registrationStatus(w http.ResponseWriter, r *http.Request) error {
	open, err := h.svc.registrationOpen(r.Context())
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, api.RegistrationStatus{Open: open})
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) error {
	var body api.RegisterRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	current, _ := h.cookies.read(r)
	out, err := h.svc.Register(r.Context(), RegisterInput{
		Email: body.Email, Password: body.Password, FamilyName: body.FamilyName,
		OwnerName: body.Owner.Name, OwnerColour: string(body.Owner.Colour), OwnerTimezone: body.Owner.Timezone,
		OwnerAvatar: body.Owner.Avatar, DeviceName: body.DeviceName,
		UserAgent: r.UserAgent(), ClientIP: h.clientIP(r), CurrentDeviceToken: current,
	})
	if err != nil {
		return err
	}
	me, err := h.svc.me(r.Context(), out.session)
	if err != nil {
		return err
	}
	h.cookies.setFamily(w, out.FamilyToken)
	h.cookies.setProfile(w, out.ProfileToken)
	return h.writeJSON(w, r, http.StatusCreated, meView(me))
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) error {
	var body api.LoginRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	current, _ := h.cookies.read(r)
	out, err := h.svc.login(r.Context(), loginInput{
		Email: body.Email, Password: body.Password, DeviceName: body.DeviceName,
		UserAgent: r.UserAgent(), ClientIP: h.clientIP(r), CurrentDeviceToken: current,
	})
	if err != nil {
		return err
	}
	h.cookies.setFamily(w, out.Token)
	// The old family session's profile session went with it.
	h.cookies.clearProfile(w)
	return h.writeJSON(w, r, http.StatusOK, api.FamilySession{
		Family: familySummaryView(out.device.Family), Profiles: profileSummaries(out.Profiles),
	})
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) error {
	fs, _ := h.cookies.read(r)
	if err := h.svc.logout(r.Context(), fs); err != nil {
		return err
	}
	h.cookies.clearBoth(w)
	return noContent(w)
}

func (h *Handler) familySession(w http.ResponseWriter, r *http.Request, d deviceSession) error {
	profiles, err := h.svc.familyProfiles(r.Context(), d.Family.ID)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, api.FamilySession{
		Family: familySummaryView(d.Family), Profiles: profileSummaries(profiles),
	})
}

func (h *Handler) selectProfile(w http.ResponseWriter, r *http.Request, d deviceSession) error {
	var body api.SelectProfileRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	id, err := uuid.Parse(body.ProfileId)
	if err != nil {
		return &ValidationError{Fields: map[string]string{"profileId": "Choose a profile."}}
	}
	out, err := h.svc.selectProfile(r.Context(), d, id, body.Pin)
	if err != nil {
		return err
	}
	me, err := h.svc.me(r.Context(), out.session)
	if err != nil {
		return err
	}
	h.cookies.setProfile(w, out.ProfileToken)
	return h.writeJSON(w, r, http.StatusOK, meView(me))
}

func (h *Handler) lockProfile(w http.ResponseWriter, r *http.Request, d deviceSession) error {
	if err := h.svc.lock(r.Context(), d); err != nil {
		return err
	}
	h.cookies.clearProfile(w)
	return noContent(w)
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request, c callerSession) error {
	me, err := h.svc.me(r.Context(), c)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, meView(me))
}

func (h *Handler) listProfiles(w http.ResponseWriter, r *http.Request, d deviceSession) error {
	profiles, err := h.svc.familyProfiles(r.Context(), d.Family.ID)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, api.ProfileList{Profiles: profileSummaries(profiles)})
}
