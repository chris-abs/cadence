package identity

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
)

// getFamily returns the family account, email included (PARENT).
func (s *Service) getFamily(_ context.Context, caller callerSession) (identitydb.Family, error) {
	if !caller.Subject.Can(authz.FamilyView) {
		return identitydb.Family{}, ErrForbidden
	}
	// The session lookup loaded the family row on this request already.
	return caller.device.Family, nil
}

// updateFamily edits the family name and auto-lock setting (PARENT).
func (s *Service) updateFamily(ctx context.Context, caller callerSession, name string, autoLockMinutes int) (identitydb.Family, error) {
	if !caller.Subject.Can(authz.FamilyEdit) {
		return identitydb.Family{}, ErrForbidden
	}
	fe := fieldErrors{}
	name, msg := normalizeName(name, maxFamilyNameChars)
	fe.add("name", msg)
	if autoLockMinutes < 1 || autoLockMinutes > 30 {
		fe.add("autoLockMinutes", "Choose between 1 and 30 minutes.")
	}
	if err := fe.err(); err != nil {
		return identitydb.Family{}, err
	}
	f, err := s.q.UpdateFamilySettings(ctx, identitydb.UpdateFamilySettingsParams{
		Name: name, AutoLockMinutes: int16(autoLockMinutes), ID: caller.device.Family.ID, //nolint:gosec // range-checked to 1–30 above.
	})
	if err != nil {
		return identitydb.Family{}, fmt.Errorf("update family: %w", err)
	}
	return f, nil
}

// changeEmail changes the sign-in email (owner, password re-entered).
// Sessions are unchanged (§3).
func (s *Service) changeEmail(ctx context.Context, caller callerSession, email, password string) (identitydb.Family, error) {
	if !caller.Subject.Can(authz.FamilyAccountManage) {
		return identitydb.Family{}, ErrForbidden
	}
	email, msg := normalizeEmail(email)
	if msg != "" {
		return identitydb.Family{}, &ValidationError{Fields: map[string]string{"email": msg}}
	}
	if err := s.verifyFamilyPassword(ctx, caller.device.Family, password); err != nil {
		return identitydb.Family{}, err
	}
	f, err := s.q.UpdateFamilyEmail(ctx, identitydb.UpdateFamilyEmailParams{Email: email, ID: caller.device.Family.ID})
	if uniqueViolation(err, constraintFamilyEmail) {
		return identitydb.Family{}, ErrEmailTaken
	}
	if err != nil {
		return identitydb.Family{}, fmt.Errorf("update family email: %w", err)
	}
	s.audit.event(ctx, evEmailChanged, familyAttr(f.ID), actorAttr(caller.Profile.ID))
	return f, nil
}

// changePassword sets a new family password (owner) and signs out every
// session of the family except this device's family and profile session.
func (s *Service) changePassword(ctx context.Context, caller callerSession, current, next string) error {
	if !caller.Subject.Can(authz.FamilyAccountManage) {
		return ErrForbidden
	}
	if msg := checkPassword(next); msg != "" {
		return &ValidationError{Fields: map[string]string{"newPassword": msg}}
	}
	if err := s.verifyFamilyPassword(ctx, caller.device.Family, current); err != nil {
		return err
	}
	hash, err := s.hasher.Hash(next)
	if err != nil {
		return err
	}
	familyID := caller.device.Family.ID
	err = s.inTx(ctx, func(q *identitydb.Queries) error {
		if err := q.UpdateFamilyPassword(ctx, identitydb.UpdateFamilyPasswordParams{PasswordHash: hash, ID: familyID}); err != nil {
			return fmt.Errorf("update password: %w", err)
		}
		if _, err := q.DeleteFamilySessionsExcept(ctx, identitydb.DeleteFamilySessionsExceptParams{
			FamilyID: familyID, Keep: []uuid.UUID{caller.device.SessionID, caller.SessionID},
		}); err != nil {
			return fmt.Errorf("sign out other sessions: %w", err)
		}
		return nil
	})
	if err != nil {
		return err
	}
	s.audit.event(ctx, evPasswordChanged, familyAttr(familyID), actorAttr(caller.Profile.ID))
	return nil
}

// transferOwnership makes another PARENT the owner (owner, password
// re-entered). The old owner is cleared before the new one is set, in one
// transaction, so the one-owner index never sees two. Sessions are unchanged.
func (s *Service) transferOwnership(ctx context.Context, caller callerSession, to uuid.UUID, password string) error {
	if !caller.Subject.Can(authz.FamilyAccountManage) {
		return ErrForbidden
	}
	if err := s.verifyFamilyPassword(ctx, caller.device.Family, password); err != nil {
		return err
	}
	familyID := caller.device.Family.ID
	err := s.inTx(ctx, func(q *identitydb.Queries) error {
		if _, err := q.GetFamilyForUpdate(ctx, familyID); err != nil {
			return fmt.Errorf("lock family: %w", err)
		}
		target, err := q.GetProfileForUpdate(ctx, identitydb.GetProfileForUpdateParams{FamilyID: familyID, ID: to})
		if err != nil {
			return notFound(err, "load profile")
		}
		switch {
		case target.ID == caller.Profile.ID:
			return ErrSelfNotAllowed
		case target.Role != string(authz.Parent):
			return &ValidationError{Fields: map[string]string{"profileId": "Ownership can only go to a PARENT profile."}}
		}
		if err := q.ClearOwner(ctx, familyID); err != nil {
			return fmt.Errorf("clear owner: %w", err)
		}
		if err := q.SetOwner(ctx, identitydb.SetOwnerParams{FamilyID: familyID, ID: to}); err != nil {
			return fmt.Errorf("set owner: %w", err)
		}
		return nil
	})
	if err != nil {
		return err
	}
	s.audit.event(ctx, evOwnerTransferred, familyAttr(familyID), actorAttr(caller.Profile.ID), profileAttr(to))
	return nil
}

// deleteFamily permanently deletes the family and, by cascade, everything
// that belongs to it [I1]: password and the family name typed again.
func (s *Service) deleteFamily(ctx context.Context, caller callerSession, password, confirmName string) error {
	if !caller.Subject.Can(authz.FamilyAccountManage) {
		return ErrForbidden
	}
	family := caller.device.Family
	if err := s.verifyFamilyPassword(ctx, family, password); err != nil {
		return err
	}
	if !strings.EqualFold(strings.TrimSpace(confirmName), family.Name) {
		return &ValidationError{Fields: map[string]string{"confirmName": "Type the family name exactly as shown."}}
	}
	if _, err := s.q.DeleteFamily(ctx, family.ID); err != nil {
		return fmt.Errorf("delete family: %w", err)
	}
	s.audit.event(ctx, evFamilyDeleted, familyAttr(family.ID), actorAttr(caller.Profile.ID))
	return nil
}
