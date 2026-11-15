package family

import (
	"net/http"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/middleware"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

type Handler struct {
	svc     *Service
	cookies middleware.Cookies
}

func NewHandler(svc *Service, cookies middleware.Cookies) *Handler {
	return &Handler{svc: svc, cookies: cookies}
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	f, err := h.svc.Get(r.Context(), caller)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(f))
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.UpdateFamilyRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	f, err := h.svc.Update(r.Context(), caller, body.Name, body.AutoLockMinutes)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(f))
}

func (h *Handler) ChangeEmail(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.ChangeEmailRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	f, err := h.svc.ChangeEmail(r.Context(), caller, body.Email, body.Password)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(f))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.DeleteFamilyRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	if err := h.svc.Delete(r.Context(), caller, body.Password, body.ConfirmName); err != nil {
		return err
	}
	h.cookies.ClearBoth(w)
	return httpx.NoContent(w)
}

func (h *Handler) Modules(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	states := h.svc.Modules(caller)
	mods := make([]api.Module, len(states))
	for i, m := range states {
		mods[i] = ModuleView(m.Module, m.Enabled)
	}
	return httpx.WriteJSON(w, http.StatusOK, api.ModuleList{Modules: mods})
}

func (h *Handler) SetModule(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.SetModuleEnabledRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	m, err := h.svc.SetModule(r.Context(), caller, r.PathValue("moduleId"), body.Enabled)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, ModuleView(m.Module, m.Enabled))
}

func View(f Family) api.Family {
	return api.Family{
		Id: f.ID.String(), Name: f.Name, Email: f.Email, AutoLockMinutes: f.AutoLockMinutes,
		PasswordChangedAt: f.PasswordChangedAt, CreatedAt: f.CreatedAt, UpdatedAt: f.UpdatedAt,
	}
}

func SummaryView(f Family) api.FamilySummary {
	return api.FamilySummary{Id: f.ID.String(), Name: f.Name, AutoLockMinutes: f.AutoLockMinutes}
}

func ModuleView(m models.Module, enabled bool) api.Module {
	return api.Module{Id: m.ID, Name: m.Name, Description: m.Description, Enabled: enabled}
}
