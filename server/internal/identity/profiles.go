package identity

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
)

// meResult is the current profile with what the client needs to render rights.
type meResult struct {
	session    callerSession
	PinAdvised bool
}

// me answers GET /me. pinAdvised: a PARENT without a PIN in a family that
// has a CHILD profile; advised, never forced (decision 0003).
func (s *Service) me(ctx context.Context, caller callerSession) (meResult, error) {
	p := caller.Profile
	if p.Role != string(authz.Parent) || p.PinHash != nil {
		return meResult{session: caller}, nil
	}
	hasChild, err := s.q.FamilyHasChild(ctx, p.FamilyID)
	if err != nil {
		return meResult{}, fmt.Errorf("check for child profiles: %w", err)
	}
	return meResult{session: caller, PinAdvised: hasChild}, nil
}

// getProfile returns one profile of the caller's family (R7: another
// family's id is not found).
func (s *Service) getProfile(ctx context.Context, caller callerSession, id uuid.UUID) (profileItem, error) {
	row, err := s.q.GetProfile(ctx, identitydb.GetProfileParams{FamilyID: caller.device.Family.ID, ID: id})
	if err != nil {
		return profileItem{}, notFound(err, "load profile")
	}
	return profileItem{Profile: row.Profile, LockedUntil: activeLock(row.LockedUntil, s.now())}, nil
}

// profileInput holds the display fields of a profile. Create also uses Role
// and Pin; update ignores them (R9: role changes have their own endpoint).
type profileInput struct {
	Name, Colour string
	Avatar       *string
	Timezone     *string // create: nil means the creator's time zone
	ContactEmail *string
	Role         string
	Pin          *string
}

func (in profileInput) validate(fe fieldErrors, tz string) (name string, contact *string) {
	name, msg := normalizeName(in.Name, maxProfileNameChars)
	fe.add("name", msg)
	fe.add("colour", checkColour(in.Colour))
	fe.add("avatar", checkAvatar(in.Avatar))
	fe.add("timezone", checkTimezone(tz))
	contact, msg = normalizeContactEmail(in.ContactEmail)
	fe.add("contactEmail", msg)
	return name, contact
}

// createProfile adds a profile (PARENT, R4). The family row is locked so two
// parallel creates cannot both pass the 20-profile cap.
func (s *Service) createProfile(ctx context.Context, caller callerSession, in profileInput) (profileItem, error) {
	if !caller.Subject.Can(authz.FamilyProfilesCreate) {
		return profileItem{}, ErrForbidden
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
		return profileItem{}, err
	}
	var pinHash *string
	if in.Pin != nil {
		h, err := s.hasher.Hash(*in.Pin)
		if err != nil {
			return profileItem{}, err
		}
		pinHash = &h
	}
	id, err := newID()
	if err != nil {
		return profileItem{}, err
	}

	familyID := caller.device.Family.ID
	var created identitydb.Profile
	err = s.inTx(ctx, func(q *identitydb.Queries) error {
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
		created, err = q.CreateProfile(ctx, identitydb.CreateProfileParams{
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
		return profileItem{}, err
	}
	s.audit.event(ctx, evProfileCreated, familyAttr(familyID), profileAttr(id), actorAttr(caller.Profile.ID),
		slog.String("role", in.Role))
	return profileItem{Profile: created}, nil
}

// updateProfile replaces a profile's display fields and contact email: self
// for anyone, any profile for a PARENT.
func (s *Service) updateProfile(ctx context.Context, caller callerSession, id uuid.UUID, in profileInput) (profileItem, error) {
	current, err := s.getProfile(ctx, caller, id)
	if err != nil {
		return profileItem{}, err
	}
	if id != caller.Profile.ID && !caller.Subject.Can(authz.FamilyProfilesEdit) {
		return profileItem{}, ErrForbidden
	}
	tz := ""
	if in.Timezone != nil {
		tz = *in.Timezone
	}
	fe := fieldErrors{}
	name, contact := in.validate(fe, tz)
	if err := fe.err(); err != nil {
		return profileItem{}, err
	}
	updated, err := s.q.UpdateProfileDisplay(ctx, identitydb.UpdateProfileDisplayParams{
		Name: name, Colour: in.Colour, Avatar: in.Avatar, Timezone: tz, ContactEmail: contact,
		FamilyID: caller.device.Family.ID, ID: id,
	})
	if uniqueViolation(err, constraintProfileName) {
		return profileItem{}, ErrNameTaken
	}
	if err != nil {
		return profileItem{}, notFound(err, "update profile")
	}
	return profileItem{Profile: updated, LockedUntil: current.LockedUntil}, nil
}

// changeRole changes a profile's role (R5): PARENT only, never yourself,
// never the owner. The target's profile sessions are deleted so its UI
// reloads with the new rights.
func (s *Service) changeRole(ctx context.Context, caller callerSession, id uuid.UUID, role string) (profileItem, error) {
	if !caller.Subject.Can(authz.FamilyProfilesRole) {
		return profileItem{}, ErrForbidden
	}
	if msg := checkRole(role); msg != "" {
		return profileItem{}, &ValidationError{Fields: map[string]string{"role": msg}}
	}
	familyID := caller.device.Family.ID
	var out profileItem
	err := s.inTx(ctx, func(q *identitydb.Queries) error {
		target, err := q.GetProfileForUpdate(ctx, identitydb.GetProfileForUpdateParams{FamilyID: familyID, ID: id})
		if err != nil {
			return notFound(err, "load profile")
		}
		if err := guardTarget(caller, target); err != nil {
			return err
		}
		updated, err := q.UpdateProfileRole(ctx, identitydb.UpdateProfileRoleParams{Role: role, FamilyID: familyID, ID: id})
		if err != nil {
			return fmt.Errorf("update role: %w", err)
		}
		if _, err := q.DeleteProfileSessionsOf(ctx, identitydb.DeleteProfileSessionsOfParams{
			ProfileID: &id, FamilyID: familyID, Keep: []uuid.UUID{},
		}); err != nil {
			return fmt.Errorf("sign out profile: %w", err)
		}
		attempt, err := q.GetPinAttempt(ctx, id)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("load pin attempts: %w", err)
		}
		out = profileItem{Profile: updated, LockedUntil: activeLock(attempt.LockedUntil, s.now())}
		return nil
	})
	if err != nil {
		return profileItem{}, err
	}
	s.audit.event(ctx, evRoleChanged, familyAttr(familyID), profileAttr(id), actorAttr(caller.Profile.ID),
		slog.String("role", role))
	return out, nil
}

// deleteProfile removes a profile (R6): PARENT only, not yourself, not the
// owner. Its sessions and PIN state go by cascade.
func (s *Service) deleteProfile(ctx context.Context, caller callerSession, id uuid.UUID) error {
	if !caller.Subject.Can(authz.FamilyProfilesDelete) {
		return ErrForbidden
	}
	familyID := caller.device.Family.ID
	err := s.inTx(ctx, func(q *identitydb.Queries) error {
		target, err := q.GetProfileForUpdate(ctx, identitydb.GetProfileForUpdateParams{FamilyID: familyID, ID: id})
		if err != nil {
			return notFound(err, "load profile")
		}
		if err := guardTarget(caller, target); err != nil {
			return err
		}
		if err := q.DeleteProfile(ctx, identitydb.DeleteProfileParams{FamilyID: familyID, ID: id}); err != nil {
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
func guardTarget(caller callerSession, target identitydb.Profile) error {
	switch {
	case target.ID == caller.Profile.ID:
		return ErrSelfNotAllowed
	case target.IsOwner:
		return ErrOwnerProtected
	}
	return nil
}
