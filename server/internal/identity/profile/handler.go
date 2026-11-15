package profile

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
	"github.com/chris-abs/cadence/server/internal/platform/validate"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) error {
	profiles, err := h.svc.List(r.Context(), models.DeviceFrom(r.Context()).FamilyID)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, api.ProfileList{Profiles: SummaryViews(profiles)})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	p, err := h.svc.Get(r.Context(), caller, id)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(p, caller))
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.CreateProfileRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	p, err := h.svc.Create(r.Context(), caller, Input{
		Name: body.Name, Colour: string(body.Colour), Avatar: body.Avatar, Timezone: body.Timezone,
		ContactEmail: body.ContactEmail, Role: string(body.Role), Pin: body.Pin,
	})
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusCreated, View(p, caller))
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	var body struct {
		Name         string          `json:"name"`
		Colour       string          `json:"colour"`
		Avatar       present[string] `json:"avatar"`
		Timezone     string          `json:"timezone"`
		ContactEmail present[string] `json:"contactEmail"`
	}
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	fe := validate.Fields{}
	if !body.Avatar.Set {
		fe.Add("avatar", "Send avatar, or null for initials.")
	}
	if !body.ContactEmail.Set {
		fe.Add("contactEmail", "Send contactEmail, or null for none.")
	}
	if err := fe.Err(); err != nil {
		return err
	}
	p, err := h.svc.Update(r.Context(), caller, id, Input{
		Name: body.Name, Colour: body.Colour, Avatar: body.Avatar.Value, Timezone: &body.Timezone,
		ContactEmail: body.ContactEmail.Value,
	})
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(p, caller))
}

func (h *Handler) ChangeRole(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	var body api.ChangeRoleRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	p, err := h.svc.ChangeRole(r.Context(), caller, id, string(body.Role))
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(p, caller))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.Delete(r.Context(), caller, id); err != nil {
		return err
	}
	return httpx.NoContent(w)
}

func (h *Handler) SetPin(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	var body struct {
		Pin        present[string] `json:"pin"`
		CurrentPin *string         `json:"currentPin,omitempty"`
		Password   *string         `json:"password,omitempty"`
	}
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	if !body.Pin.Set {
		return models.Invalid("pin", "Send the new PIN, or null to remove it.")
	}
	if err := h.svc.SetPIN(r.Context(), caller, id, PINInput{
		Pin: body.Pin.Value, CurrentPin: body.CurrentPin, Password: body.Password,
	}); err != nil {
		return err
	}
	return httpx.NoContent(w)
}

func (h *Handler) TransferOwnership(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.TransferOwnershipRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	to, err := uuid.Parse(body.ProfileId)
	if err != nil {
		return models.ErrNotFound
	}
	if err := h.svc.TransferOwnership(r.Context(), caller, to, body.Password); err != nil {
		return err
	}
	return httpx.NoContent(w)
}

func pathID(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(r.PathValue("profileId"))
	if err != nil {
		return uuid.UUID{}, models.ErrNotFound
	}
	return id, nil
}

func View(p Profile, viewer models.Caller) api.Profile {
	v := api.Profile{
		Id: p.ID.String(), Name: p.Name, Role: api.Role(p.Role), IsOwner: p.IsOwner,
		Colour: api.ProfileColour(p.Colour), Avatar: p.Avatar, Timezone: p.Timezone,
		HasPin: p.HasPin, LockedUntil: p.LockedUntil, CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt,
	}
	if viewer.ProfileID == p.ID || viewer.Role == models.Parent {
		v.ContactEmail = p.ContactEmail
		v.ContactEmailVerifiedAt = p.ContactEmailVerifiedAt
	}
	return v
}

func SummaryViews(profiles []Profile) []api.ProfileSummary {
	out := make([]api.ProfileSummary, len(profiles))
	for i, p := range profiles {
		out[i] = api.ProfileSummary{
			Id: p.ID.String(), Name: p.Name, Role: api.Role(p.Role), IsOwner: p.IsOwner,
			Colour: api.ProfileColour(p.Colour), Avatar: p.Avatar, Timezone: p.Timezone,
			HasPin: p.HasPin, LockedUntil: p.LockedUntil, LockedForSeconds: wholeSeconds(p.LockedFor),
			CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt,
		}
	}
	return out
}

func wholeSeconds(d time.Duration) *int {
	if d <= 0 {
		return nil
	}
	secs := max(1, int(math.Ceil(d.Seconds())))
	return &secs
}

// present tells a missing key from an explicit null, which the generated types cannot.
type present[T any] struct {
	Set   bool
	Value *T
}

func (p *present[T]) UnmarshalJSON(b []byte) error {
	p.Set = true
	if string(b) == "null" {
		p.Value = nil
		return nil
	}
	var v T
	if err := json.Unmarshal(b, &v); err != nil {
		return fmt.Errorf("decode field: %w", err)
	}
	p.Value = &v
	return nil
}
