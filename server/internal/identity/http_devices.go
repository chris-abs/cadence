package identity

import (
	"net/http"

	"github.com/chris-abs/cadence/server/internal/api"
)

func (h *Handler) listSessions(w http.ResponseWriter, r *http.Request, c callerSession) error {
	items, err := h.svc.listDevices(r.Context(), c)
	if err != nil {
		return err
	}
	sessions := make([]api.DeviceSession, len(items))
	for i, d := range items {
		sessions[i] = deviceView(d)
	}
	return h.writeJSON(w, r, http.StatusOK, api.DeviceSessionList{Sessions: sessions})
}

func (h *Handler) revokeSession(w http.ResponseWriter, r *http.Request, c callerSession) error {
	id, err := pathID(r, "sessionId")
	if err != nil {
		return err
	}
	current, err := h.svc.revokeDevice(r.Context(), c, id)
	if err != nil {
		return err
	}
	if current {
		h.cookies.clearBoth(w)
	}
	return noContent(w)
}

func (h *Handler) revokeOtherSessions(w http.ResponseWriter, r *http.Request, c callerSession) error {
	if err := h.svc.revokeOtherDevices(r.Context(), c); err != nil {
		return err
	}
	return noContent(w)
}
