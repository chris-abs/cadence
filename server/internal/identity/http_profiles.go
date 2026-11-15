package identity

import (
	"net/http"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

func (h *Handler) getProfile(w http.ResponseWriter, r *http.Request, c callerSession) error {
	id, err := pathID(r, "profileId")
	if err != nil {
		return err
	}
	p, err := h.svc.getProfile(r.Context(), c, id)
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, profileView(p, c.Subject))
}

func (h *Handler) createProfile(w http.ResponseWriter, r *http.Request, c callerSession) error {
	var body api.CreateProfileRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	p, err := h.svc.createProfile(r.Context(), c, profileInput{
		Name: body.Name, Colour: string(body.Colour), Avatar: body.Avatar, Timezone: body.Timezone,
		ContactEmail: body.ContactEmail, Role: string(body.Role), Pin: body.Pin,
	})
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusCreated, profileView(p, c.Subject))
}

func (h *Handler) updateProfile(w http.ResponseWriter, r *http.Request, c callerSession) error {
	id, err := pathID(r, "profileId")
	if err != nil {
		return err
	}
	var body updateProfileBody
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	fe := fieldErrors{}
	if !body.Avatar.Set {
		fe.add("avatar", "Send avatar, or null for initials.")
	}
	if !body.ContactEmail.Set {
		fe.add("contactEmail", "Send contactEmail, or null for none.")
	}
	if err := fe.err(); err != nil {
		return err
	}
	p, err := h.svc.updateProfile(r.Context(), c, id, profileInput{
		Name: body.Name, Colour: body.Colour, Avatar: body.Avatar.Value, Timezone: &body.Timezone,
		ContactEmail: body.ContactEmail.Value,
	})
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, profileView(p, c.Subject))
}

func (h *Handler) changeRole(w http.ResponseWriter, r *http.Request, c callerSession) error {
	id, err := pathID(r, "profileId")
	if err != nil {
		return err
	}
	var body api.ChangeRoleRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	p, err := h.svc.changeRole(r.Context(), c, id, string(body.Role))
	if err != nil {
		return err
	}
	return h.writeJSON(w, r, http.StatusOK, profileView(p, c.Subject))
}

func (h *Handler) deleteProfile(w http.ResponseWriter, r *http.Request, c callerSession) error {
	id, err := pathID(r, "profileId")
	if err != nil {
		return err
	}
	if err := h.svc.deleteProfile(r.Context(), c, id); err != nil {
		return err
	}
	return noContent(w)
}

func (h *Handler) setPin(w http.ResponseWriter, r *http.Request, c callerSession) error {
	id, err := pathID(r, "profileId")
	if err != nil {
		return err
	}
	var body setPinBody
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	if !body.Pin.Set {
		return &ValidationError{Fields: map[string]string{"pin": "Send the new PIN, or null to remove it."}}
	}
	if err := h.svc.setPIN(r.Context(), c, id, setPINInput{
		Pin: body.Pin.Value, CurrentPin: body.CurrentPin, Password: body.Password,
	}); err != nil {
		return err
	}
	return noContent(w)
}
