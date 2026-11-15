package identity

import (
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
)

// Conversions from domain values to the contract's generated types.

func familySummaryView(f identitydb.Family) api.FamilySummary {
	return api.FamilySummary{Id: f.ID.String(), Name: f.Name, AutoLockMinutes: int(f.AutoLockMinutes)}
}

func familyView(f identitydb.Family) api.Family {
	return api.Family{
		Id: f.ID.String(), Name: f.Name, Email: f.Email, AutoLockMinutes: int(f.AutoLockMinutes),
		PasswordChangedAt: f.PasswordChangedAt, CreatedAt: f.CreatedAt, UpdatedAt: f.UpdatedAt,
	}
}

// profileSummaryView is the picker view. It never carries contact details.
func profileSummaryView(p profileItem) api.ProfileSummary {
	pr := p.Profile
	return api.ProfileSummary{
		Id: pr.ID.String(), Name: pr.Name, Role: api.Role(pr.Role), IsOwner: pr.IsOwner,
		Colour: api.ProfileColour(pr.Colour), Avatar: pr.Avatar, Timezone: pr.Timezone,
		HasPin: pr.PinHash != nil, LockedUntil: p.LockedUntil, LockedForSeconds: wholeSeconds(p.LockedFor),
		CreatedAt: pr.CreatedAt, UpdatedAt: pr.UpdatedAt,
	}
}

// wholeSeconds rounds a remaining wait up to whole seconds (at least one), or
// nil when there is none, so a countdown never reaches zero early.
func wholeSeconds(d time.Duration) *int {
	if d <= 0 {
		return nil
	}
	secs := max(1, int(math.Ceil(d.Seconds())))
	return &secs
}

func profileSummaries(items []profileItem) []api.ProfileSummary {
	out := make([]api.ProfileSummary, len(items))
	for i, p := range items {
		out[i] = profileSummaryView(p)
	}
	return out
}

// profileView is the full view. Contact fields are visible to the profile
// itself and to PARENTs; for anyone else they are null, so a CHILD cannot
// tell whether another profile has one (spec §5.1).
func profileView(p profileItem, viewer authz.Subject) api.Profile {
	pr := p.Profile
	v := api.Profile{
		Id: pr.ID.String(), Name: pr.Name, Role: api.Role(pr.Role), IsOwner: pr.IsOwner,
		Colour: api.ProfileColour(pr.Colour), Avatar: pr.Avatar, Timezone: pr.Timezone,
		HasPin: pr.PinHash != nil, LockedUntil: p.LockedUntil, CreatedAt: pr.CreatedAt, UpdatedAt: pr.UpdatedAt,
	}
	if viewer.ProfileID == pr.ID || viewer.Role == authz.Parent {
		v.ContactEmail = pr.ContactEmail
		v.ContactEmailVerifiedAt = pr.ContactEmailVerifiedAt
	}
	return v
}

func meView(m meResult) api.Me {
	c := m.session
	mods := c.Subject.EnabledModules()
	modules := make([]api.Module, len(mods))
	for i, mod := range mods {
		modules[i] = moduleView(moduleItem{Module: mod, Enabled: true})
	}
	return api.Me{
		Profile:     profileView(profileItem{Profile: c.Profile, LockedUntil: c.LockedUntil}, c.Subject),
		Family:      familySummaryView(c.device.Family),
		Permissions: c.Subject.Permissions(),
		Modules:     modules,
		PinAdvised:  m.PinAdvised,
		Session:     api.ProfileSessionInfo{ExpiresAt: c.ExpiresAt, IdleTimeoutSeconds: int(ProfileIdleTimeout.Seconds())},
	}
}

func moduleView(m moduleItem) api.Module {
	return api.Module{Id: m.Module.ID, Name: m.Module.Name, Description: m.Module.Description, Enabled: m.Enabled}
}

func deviceView(d deviceItem) api.DeviceSession {
	v := api.DeviceSession{
		Id: d.Row.ID.String(), DeviceName: d.Row.DeviceName, UserAgent: d.Row.UserAgent,
		CreatedAt: d.Row.CreatedAt, LastSeenAt: d.Row.LastSeenAt, Current: d.Current,
		ActiveProfileName: d.Row.ActiveProfileName,
	}
	if d.Row.ActiveProfileID != nil {
		id := d.Row.ActiveProfileID.String()
		v.ActiveProfileId = &id
	}
	return v
}

// present is a JSON field that is required but may be null. Go decodes a
// missing key and null alike, so the generated types cannot tell "clear it"
// from "forgot it"; Set records that the key was there.
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

// updateProfileBody is api.UpdateProfileRequest with presence tracking for
// the nullable keys (full replace: a missing key is an error, null clears).
type updateProfileBody struct {
	Name         string          `json:"name"`
	Colour       string          `json:"colour"`
	Avatar       present[string] `json:"avatar"`
	Timezone     string          `json:"timezone"`
	ContactEmail present[string] `json:"contactEmail"`
}

// setPinBody is api.SetPinRequest with presence tracking for pin: a body
// without the key is rejected rather than read as "remove the PIN".
type setPinBody struct {
	Pin        present[string] `json:"pin"`
	CurrentPin *string         `json:"currentPin,omitempty"`
	Password   *string         `json:"password,omitempty"`
}
