package identity

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
)

// lockoutAfter is the PIN lockout schedule (spec §6.2): failures 1–4 are
// free, then each further failure locks the profile for longer.
func lockoutAfter(failures int32) time.Duration {
	switch {
	case failures < 5:
		return 0
	case failures == 5:
		return 30 * time.Second
	case failures == 6:
		return time.Minute
	case failures == 7:
		return 5 * time.Minute
	case failures == 8:
		return 15 * time.Minute
	default:
		return time.Hour
	}
}

// verifyPIN checks pin against a profile row locked FOR UPDATE, so parallel
// guesses are counted one at a time. The lockout is checked before bcrypt.
// It returns a verdict (nil, ErrInvalidPIN or a locked *RetryError) that the
// caller must return only after committing, so failures persist; err is for
// infrastructure failures.
func (s *Service) verifyPIN(ctx context.Context, q *identitydb.Queries, p identitydb.Profile, pin string) (verdict, err error) {
	now := s.now()
	attempt, err := q.GetPinAttempt(ctx, p.ID)
	hasFailures := err == nil
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("load pin attempts: %w", err)
	}
	if until := activeLock(attempt.LockedUntil, now); until != nil {
		return &RetryError{Locked: true, After: until.Sub(now)}, nil
	}
	ok, err := s.hasher.Matches(*p.PinHash, pin)
	if err != nil {
		return nil, fmt.Errorf("compare pin: %w", err)
	}
	if ok {
		if hasFailures {
			if err := q.ClearPinAttempts(ctx, p.ID); err != nil {
				return nil, fmt.Errorf("clear pin attempts: %w", err)
			}
		}
		return nil, nil
	}

	failures, err := q.RecordPinFailure(ctx, identitydb.RecordPinFailureParams{ProfileID: p.ID, Now: now})
	if err != nil {
		return nil, fmt.Errorf("record pin failure: %w", err)
	}
	attrs := []slog.Attr{familyAttr(p.FamilyID), profileAttr(p.ID), slog.Int("failed_count", int(failures))}
	s.audit.event(ctx, evPinFailed, attrs...)
	lock := lockoutAfter(failures)
	if lock == 0 {
		return ErrInvalidPIN, nil
	}
	until := now.Add(lock)
	if err := q.LockPin(ctx, identitydb.LockPinParams{ProfileID: p.ID, LockedUntil: &until}); err != nil {
		return nil, fmt.Errorf("lock pin: %w", err)
	}
	s.audit.event(ctx, evPinLocked, append(attrs, slog.Duration("locked_for", lock))...)
	// The guess that triggers a lock answers pin_locked straight away, so the
	// client can show the countdown without another failed attempt.
	return &RetryError{Locked: true, After: lock}, nil
}

// setPINInput is PUT /profiles/{id}/pin. Pin nil removes the PIN.
type setPINInput struct {
	Pin        *string
	CurrentPin *string
	Password   *string
}

// setPIN sets, changes, removes or resets a profile's PIN with the proof the
// spec §2 table requires for this actor and target.
func (s *Service) setPIN(ctx context.Context, caller callerSession, targetID uuid.UUID, in setPINInput) error {
	fe := fieldErrors{}
	if in.Pin != nil {
		fe.add("pin", checkPIN(*in.Pin))
	}
	if in.CurrentPin != nil {
		fe.add("currentPin", checkPIN(*in.CurrentPin))
	}
	if err := fe.err(); err != nil {
		return err
	}

	self := targetID == caller.Profile.ID
	var (
		verdict error
		by      string
	)
	err := s.inTx(ctx, func(q *identitydb.Queries) error {
		target, err := q.GetProfileForUpdate(ctx, identitydb.GetProfileForUpdateParams{FamilyID: caller.device.Family.ID, ID: targetID})
		if err != nil {
			return notFound(err, "load profile")
		}

		switch {
		case self:
			by = "self"
			if target.PinHash != nil {
				if verdict, err = s.proveOwnPIN(ctx, q, caller, target, in); err != nil || verdict != nil {
					return err
				}
			}
		case target.Role == string(authz.Child):
			by = "parent"
			if !caller.Subject.Can(authz.FamilyPinsResetChild) {
				return ErrForbidden
			}
		default:
			by = "owner"
			if !caller.Subject.Can(authz.FamilyPinsResetParent) {
				return ErrForbidden
			}
		}

		var hash *string
		if in.Pin != nil {
			h, err := s.hasher.Hash(*in.Pin)
			if err != nil {
				return err
			}
			hash = &h
		}
		if err := q.SetProfilePin(ctx, identitydb.SetProfilePinParams{PinHash: hash, FamilyID: target.FamilyID, ID: target.ID}); err != nil {
			return fmt.Errorf("set pin: %w", err)
		}
		if err := q.ClearPinAttempts(ctx, target.ID); err != nil {
			return fmt.Errorf("clear pin attempts: %w", err)
		}
		keep := []uuid.UUID{}
		if self {
			keep = append(keep, caller.SessionID)
		}
		if _, err := q.DeleteProfileSessionsOf(ctx, identitydb.DeleteProfileSessionsOfParams{
			ProfileID: &target.ID, FamilyID: target.FamilyID, Keep: keep,
		}); err != nil {
			return fmt.Errorf("sign out profile: %w", err)
		}
		return nil
	})
	if err != nil {
		return err
	}
	if verdict != nil {
		return verdict
	}
	s.audit.event(ctx, evPinChanged, familyAttr(caller.device.Family.ID), profileAttr(targetID),
		actorAttr(caller.Profile.ID), slog.String("by", by))
	return nil
}

// proveOwnPIN checks the proof for changing one's own existing PIN: the
// current PIN (counted towards lockout), or the family password for a PARENT
// who forgot theirs [I5].
func (s *Service) proveOwnPIN(ctx context.Context, q *identitydb.Queries, caller callerSession, target identitydb.Profile, in setPINInput) (verdict, err error) {
	switch {
	case in.CurrentPin != nil:
		return s.verifyPIN(ctx, q, target, *in.CurrentPin)
	case in.Password != nil:
		if caller.Subject.Role != authz.Parent {
			return nil, ErrForbidden
		}
		return nil, s.verifyFamilyPassword(ctx, caller.device.Family, *in.Password)
	default:
		return nil, &ValidationError{Fields: map[string]string{"currentPin": "Enter your current PIN."}}
	}
}
