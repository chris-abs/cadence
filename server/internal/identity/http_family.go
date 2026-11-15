package identity

import (
	"net/http"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

func (h *Handler) getFamily(w http.ResponseWriter, r *http.Request, c callerSession) error {
	f, err := h.svc.getFamily(r.Context(), c)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, familyView(f))
}

func (h *Handler) updateFamily(w http.ResponseWriter, r *http.Request, c callerSession) error {
	var body api.UpdateFamilyRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	f, err := h.svc.updateFamily(r.Context(), c, body.Name, body.AutoLockMinutes)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, familyView(f))
}

func (h *Handler) changeEmail(w http.ResponseWriter, r *http.Request, c callerSession) error {
	var body api.ChangeEmailRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	f, err := h.svc.changeEmail(r.Context(), c, body.Email, body.Password)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, familyView(f))
}

func (h *Handler) changePassword(w http.ResponseWriter, r *http.Request, c callerSession) error {
	var body api.ChangePasswordRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	if err := h.svc.changePassword(r.Context(), c, body.CurrentPassword, body.NewPassword); err != nil {
		return err
	}
	return noContent(w)
}

func (h *Handler) transferOwnership(w http.ResponseWriter, r *http.Request, c callerSession) error {
	var body api.TransferOwnershipRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	to, err := uuid.Parse(body.ProfileId)
	if err != nil {
		return ErrNotFound
	}
	if err := h.svc.transferOwnership(r.Context(), c, to, body.Password); err != nil {
		return err
	}
	return noContent(w)
}

func (h *Handler) deleteFamily(w http.ResponseWriter, r *http.Request, c callerSession) error {
	var body api.DeleteFamilyRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	if err := h.svc.deleteFamily(r.Context(), c, body.Password, body.ConfirmName); err != nil {
		return err
	}
	h.cookies.clearBoth(w)
	return noContent(w)
}
