package identity

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/store"
)

// Me is the current profile with what the client needs to render rights.
type Me struct {
	Caller     Caller
	PinAdvised bool
}

// Me answers GET /me. pinAdvised: a PARENT without a PIN in a family that
// has a CHILD profile; advised, never forced (decision 0003).
func (s *Service) Me(ctx context.Context, caller Caller) (Me, error) {
	p := caller.Profile
	if p.Role != string(authz.Parent) || p.PinHash != nil {
		return Me{Caller: caller}, nil
	}
	hasChild, err := s.q.FamilyHasChild(ctx, p.FamilyID)
	if err != nil {
		return Me{}, fmt.Errorf("check for child profiles: %w", err)
	}
	return Me{Caller: caller, PinAdvised: hasChild}, nil
}

// GetProfile returns one profile of the caller's family (R7: another
// family's id is not found).
func (s *Service) GetProfile(ctx context.Context, caller Caller, id uuid.UUID) (ProfileItem, error) {
	row, err := s.q.GetProfile(ctx, store.GetProfileParams{FamilyID: caller.Device.Family.ID, ID: id})
	if err != nil {
		return ProfileItem{}, notFound(err, "load profile")
	}
	return ProfileItem{Profile: row.Profile, LockedUntil: activeLock(row.LockedUntil, s.now())}, nil
}

// ProfileInput holds the display fields of a profile. Create also uses Role
// and Pin; update ignores them (R9: role changes have their own endpoint).
type ProfileInput struct {
	Name, Colour string
	Avatar       *string
	Timezone     *string // create: nil means the creator's time zone
	ContactEmail *string
	Role         string
	Pin          *string
}

func (in ProfileInput) validate(fe fieldErrors, tz string) (name string, contact *string) {
	name, msg := normalizeName(in.Name, maxProfileNameChars)
	fe.add("name", msg)
	fe.add("colour", checkColour(in.Colour))
	fe.add("avatar", checkAvatar(in.Avatar))
	fe.add("timezone", checkTimezone(tz))
	contact, msg = normalizeContactEmail(in.ContactEmail)
	fe.add("contactEmail", msg)
	return name, contact
}

// CreateProfile adds a profile (PARENT, R4). The family row is locked so two
// parallel creates cannot both pass the 20-profile cap.
func (s *Service) CreateProfile(ctx context.Context, caller Caller, in ProfileInput) (ProfileItem, error) {
	if !caller.Subject.Can(authz.FamilyProfilesCreate) {
		return ProfileItem{}, ErrForbidden
	}
	tz := caller.Profile.Timezone
	if in.Timezone != nil {
		tz = *in.Timezone
	}
	fe := fieldErrors{}
	name, contact := in.validate(fe, tz)
	fe.add("role", checkRole(in.Role))
	if in.Pin != nil {
		fe.add("pin", checkPIN(*in.Pin))
	}
	if err := fe.err(); err != nil {
		return ProfileItem{}, err
	}
	var pinHash *string
	if in.Pin != nil {
		h, err := s.hasher.Hash(*in.Pin)
		if err != nil {
			return ProfileItem{}, err
		}
		pinHash = &h
	}
	id, err := newID()
	if err != nil {
		return ProfileItem{}, err
	}

	familyID := caller.Device.Family.ID
	var created store.Profile
	err = s.inTx(ctx, func(q *store.Queries) error {
		if _, err := q.GetFamilyForUpdate(ctx, familyID); err != nil {
			return fmt.Errorf("lock family: %w", err)
		}
		n, err := q.CountProfiles(ctx, familyID)
		if err != nil {
			return fmt.Errorf("count profiles: %w", err)
		}
		if n >= maxProfiles {
			return ErrProfileLimitReached
		}
		created, err = q.CreateProfile(ctx, store.CreateProfileParams{
			ID: id, FamilyID: familyID, Name: name, Role: in.Role, IsOwner: false,
			Colour: in.Colour, Avatar: in.Avatar, Timezone: tz, PinHash: pinHash, ContactEmail: contact,
		})
		if uniqueViolation(err, constraintProfileName) {
			return ErrNameTaken
		}
		if err != nil {
			return fmt.Errorf("create profile: %w", err)
		}
		return nil
	})
	if err != nil {
		return ProfileItem{}, err
	}
	s.audit.event(ctx, evProfileCreated, familyAttr(familyID), profileAttr(id), actorAttr(caller.Profile.ID),
		slog.String("role", in.Role))
	return ProfileItem{Profile: created}, nil
}

// UpdateProfile replaces a profile's display fields and contact email: self
// for anyone, any profile for a PARENT.
func (s *Service) UpdateProfile(ctx context.Context, caller Caller, id uuid.UUID, in ProfileInput) (ProfileItem, error) {
	current, err := s.GetProfile(ctx, caller, id)
	if err != nil {
		return ProfileItem{}, err
	}
	if id != caller.Profile.ID && !caller.Subject.Can(authz.FamilyProfilesEdit) {
		return ProfileItem{}, ErrForbidden
	}
	tz := ""
	if in.Timezone != nil {
		tz = *in.Timezone
	}
	fe := fieldErrors{}
	name, contact := in.validate(fe, tz)
	if err := fe.err(); err != nil {
		return ProfileItem{}, err
	}
	updated, err := s.q.UpdateProfileDisplay(ctx, store.UpdateProfileDisplayParams{
		Name: name, Colour: in.Colour, Avatar: in.Avatar, Timezone: tz, ContactEmail: contact,
		FamilyID: caller.Device.Family.ID, ID: id,
	})
	if uniqueViolation(err, constraintProfileName) {
		return ProfileItem{}, ErrNameTaken
	}
	if err != nil {
		return ProfileItem{}, notFound(err, "update profile")
	}
	return ProfileItem{Profile: updated, LockedUntil: current.LockedUntil}, nil
}

// ChangeRole changes a profile's role (R5): PARENT only, never yourself,
// never the owner. The target's profile sessions are deleted so its UI
// reloads with the new rights.
func (s *Service) ChangeRole(ctx context.Context, caller Caller, id uuid.UUID, role string) (ProfileItem, error) {
	if !caller.Subject.Can(authz.FamilyProfilesRole) {
		return ProfileItem{}, ErrForbidden
	}
	if msg := checkRole(role); msg != "" {
		return ProfileItem{}, &ValidationError{Fields: map[string]string{"role": msg}}
	}
	familyID := caller.Device.Family.ID
	var out ProfileItem
	err := s.inTx(ctx, func(q *store.Queries) error {
		target, err := q.GetProfileForUpdate(ctx, store.GetProfileForUpdateParams{FamilyID: familyID, ID: id})
		if err != nil {
			return notFound(err, "load profile")
		}
		if err := guardTarget(caller, target); err != nil {
			return err
		}
		updated, err := q.UpdateProfileRole(ctx, store.UpdateProfileRoleParams{Role: role, FamilyID: familyID, ID: id})
		if err != nil {
			return fmt.Errorf("update role: %w", err)
		}
		if _, err := q.DeleteProfileSessionsOf(ctx, store.DeleteProfileSessionsOfParams{
			ProfileID: &id, FamilyID: familyID, Keep: []uuid.UUID{},
		}); err != nil {
			return fmt.Errorf("sign out profile: %w", err)
		}
		attempt, err := q.GetPinAttempt(ctx, id)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("load pin attempts: %w", err)
		}
		out = ProfileItem{Profile: updated, LockedUntil: activeLock(attempt.LockedUntil, s.now())}
		return nil
	})
	if err != nil {
		return ProfileItem{}, err
	}
	s.audit.event(ctx, evRoleChanged, familyAttr(familyID), profileAttr(id), actorAttr(caller.Profile.ID),
		slog.String("role", role))
	return out, nil
}

// DeleteProfile removes a profile (R6): PARENT only, not yourself, not the
// owner. Its sessions and PIN state go by cascade.
func (s *Service) DeleteProfile(ctx context.Context, caller Caller, id uuid.UUID) error {
	if !caller.Subject.Can(authz.FamilyProfilesDelete) {
		return ErrForbidden
	}
	familyID := caller.Device.Family.ID
	err := s.inTx(ctx, func(q *store.Queries) error {
		target, err := q.GetProfileForUpdate(ctx, store.GetProfileForUpdateParams{FamilyID: familyID, ID: id})
		if err != nil {
			return notFound(err, "load profile")
		}
		if err := guardTarget(caller, target); err != nil {
			return err
		}
		if err := q.DeleteProfile(ctx, store.DeleteProfileParams{FamilyID: familyID, ID: id}); err != nil {
			return fmt.Errorf("delete profile: %w", err)
		}
		return nil
	})
	if err != nil {
		return err
	}
	s.audit.event(ctx, evProfileDeleted, familyAttr(familyID), profileAttr(id), actorAttr(caller.Profile.ID))
	return nil
}

// guardTarget refuses role changes and deletion aimed at yourself or the owner.
func guardTarget(caller Caller, target store.Profile) error {
	switch {
	case target.ID == caller.Profile.ID:
		return ErrSelfNotAllowed
	case target.IsOwner:
		return ErrOwnerProtected
	}
	return nil
}
