package identity

import (
	"net/http"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

func (h *Handler) listModules(w http.ResponseWriter, r *http.Request, c callerSession) error {
	items := h.svc.listModules(c)
	mods := make([]api.Module, len(items))
	for i, m := range items {
		mods[i] = moduleView(m)
	}
	return h.writeJSON(w, r, http.StatusOK, api.ModuleList{Modules: mods})
}

func (h *Handler) setModuleEnabled(w http.ResponseWriter, r *http.Request, c callerSession) error {
	var body api.SetModuleEnabledRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	m, err := h.svc.setModuleEnabled(r.Context(), c, r.PathValue("moduleId"), body.Enabled)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, moduleView(m))
}
