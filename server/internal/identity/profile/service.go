package profile

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/audit"
	"github.com/chris-abs/cadence/server/internal/platform/db"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
)

type PasswordVerifier interface {
	VerifyPassword(ctx context.Context, familyID uuid.UUID, password string) error
}

type SessionEnder interface {
	EndProfileSessions(ctx context.Context, conn db.DBTX, familyID, profileID uuid.UUID, keep []uuid.UUID) error
}

type Service struct {
	pool      *pgxpool.Pool
	repo      *Repository
	hasher    passhash.Hasher
	now       func() time.Time
	log       *slog.Logger
	passwords PasswordVerifier
	sessions  SessionEnder
}

func NewService(pool *pgxpool.Pool, hasher passhash.Hasher, now func() time.Time, log *slog.Logger, passwords PasswordVerifier, sessions SessionEnder) *Service {
	return &Service{pool: pool, repo: NewRepository(pool), hasher: hasher, now: now, log: log, passwords: passwords, sessions: sessions}
}

func (s *Service) inTx(ctx context.Context, fn func(pgx.Tx, *Repository) error) error {
	return db.InTx(ctx, s.pool, func(tx pgx.Tx) error { return fn(tx, NewRepository(tx)) })
}

func (s *Service) List(ctx context.Context, familyID uuid.UUID) ([]Profile, error) {
	profiles, err := s.repo.list(ctx, familyID)
	if err != nil {
		return nil, err
	}
	now := s.now()
	for i := range profiles {
		p := &profiles[i]
		if p.LockedUntil = activeLock(p.LockedUntil, now); p.LockedUntil != nil {
			p.LockedFor = p.LockedUntil.Sub(now)
		}
	}
	return profiles, nil
}

func (s *Service) Get(ctx context.Context, caller models.Caller, id uuid.UUID) (Profile, error) {
	p, err := s.repo.get(ctx, caller.FamilyID, id)
	if err != nil {
		return Profile{}, err
	}
	p.LockedUntil = activeLock(p.LockedUntil, s.now())
	return p, nil
}

func (s *Service) PinAdvised(ctx context.Context, p Profile) (bool, error) {
	if p.Role != models.Parent || p.HasPin() {
		return false, nil
	}
	return s.repo.hasChild(ctx, p.FamilyID)
}

func (s *Service) Create(ctx context.Context, caller models.Caller, in Input) (Profile, error) {
	if !caller.Can(models.FamilyProfilesCreate) {
		return Profile{}, models.ErrForbidden
	}
	tz := caller.Timezone
	if in.Timezone != nil {
		tz = *in.Timezone
	}
	fe := models.FieldErrors{}
	name := ValidateDisplay(fe, "", in.Name, in.Colour, in.Avatar, tz)
	contact, msg := normalizeContactEmail(in.ContactEmail)
	fe.Add("contactEmail", msg)
	fe.Add("role", checkRole(in.Role))
	if in.Pin != nil {
		fe.Add("pin", checkPIN(*in.Pin))
	}
	if err := fe.Err(); err != nil {
		return Profile{}, err
	}
	var pinHash *string
	if in.Pin != nil {
		h, err := s.hasher.Hash(*in.Pin)
		if err != nil {
			return Profile{}, err
		}
		pinHash = &h
	}
	id, err := models.NewID()
	if err != nil {
		return Profile{}, err
	}
	var created Profile
	err = s.inTx(ctx, func(_ pgx.Tx, r *Repository) error {
		if err := r.lockFamily(ctx, caller.FamilyID); err != nil {
			return err
		}
		n, err := r.count(ctx, caller.FamilyID)
		if err != nil {
			return err
		}
		if n >= maxProfiles {
			return models.ErrProfileLimitReached
		}
		created, err = r.Create(ctx, NewProfile{
			ID: id, FamilyID: caller.FamilyID, Name: name, Role: models.Role(in.Role),
			Colour: in.Colour, Avatar: in.Avatar, Timezone: tz, PinHash: pinHash, ContactEmail: contact,
		})
		return err
	})
	if err != nil {
		return Profile{}, err
	}
	audit.Event(ctx, s.log, "profile.created", audit.Family(caller.FamilyID), audit.Profile(id),
		audit.Actor(caller.ProfileID), slog.String("role", in.Role))
	return created, nil
}

func (s *Service) Update(ctx context.Context, caller models.Caller, id uuid.UUID, in Input) (Profile, error) {
	current, err := s.Get(ctx, caller, id)
	if err != nil {
		return Profile{}, err
	}
	if id != caller.ProfileID && !caller.Can(models.FamilyProfilesEdit) {
		return Profile{}, models.ErrForbidden
	}
	tz := ""
	if in.Timezone != nil {
		tz = *in.Timezone
	}
	fe := models.FieldErrors{}
	name := ValidateDisplay(fe, "", in.Name, in.Colour, in.Avatar, tz)
	contact, msg := normalizeContactEmail(in.ContactEmail)
	fe.Add("contactEmail", msg)
	if err := fe.Err(); err != nil {
		return Profile{}, err
	}
	updated, err := s.repo.updateDisplay(ctx, caller.FamilyID, id, name, in.Colour, in.Avatar, tz, contact)
	if err != nil {
		return Profile{}, err
	}
	updated.LockedUntil = current.LockedUntil
	return updated, nil
}

func (s *Service) ChangeRole(ctx context.Context, caller models.Caller, id uuid.UUID, role string) (Profile, error) {
	if !caller.Can(models.FamilyProfilesRole) {
		return Profile{}, models.ErrForbidden
	}
	if msg := checkRole(role); msg != "" {
		return Profile{}, models.Invalid("role", msg)
	}
	var out Profile
	err := s.inTx(ctx, func(tx pgx.Tx, r *Repository) error {
		target, err := r.getForUpdate(ctx, caller.FamilyID, id)
		if err != nil {
			return err
		}
		if err := guardTarget(caller, target); err != nil {
			return err
		}
		if out, err = r.updateRole(ctx, caller.FamilyID, id, role); err != nil {
			return err
		}
		if err := s.sessions.EndProfileSessions(ctx, tx, caller.FamilyID, id, []uuid.UUID{}); err != nil {
			return err
		}
		_, lockedUntil, err := r.pinAttempt(ctx, id)
		out.LockedUntil = activeLock(lockedUntil, s.now())
		return err
	})
	if err != nil {
		return Profile{}, err
	}
	audit.Event(ctx, s.log, "profile.role_changed", audit.Family(caller.FamilyID), audit.Profile(id),
		audit.Actor(caller.ProfileID), slog.String("role", role))
	return out, nil
}

func (s *Service) Delete(ctx context.Context, caller models.Caller, id uuid.UUID) error {
	if !caller.Can(models.FamilyProfilesDelete) {
		return models.ErrForbidden
	}
	err := s.inTx(ctx, func(_ pgx.Tx, r *Repository) error {
		target, err := r.getForUpdate(ctx, caller.FamilyID, id)
		if err != nil {
			return err
		}
		if err := guardTarget(caller, target); err != nil {
			return err
		}
		return r.delete(ctx, caller.FamilyID, id)
	})
	if err != nil {
		return err
	}
	audit.Event(ctx, s.log, "profile.deleted", audit.Family(caller.FamilyID), audit.Profile(id),
		audit.Actor(caller.ProfileID))
	return nil
}

func guardTarget(caller models.Caller, target Profile) error {
	switch {
	case target.ID == caller.ProfileID:
		return models.ErrSelfNotAllowed
	case target.IsOwner:
		return models.ErrOwnerProtected
	}
	return nil
}

func (s *Service) TransferOwnership(ctx context.Context, caller models.Caller, to uuid.UUID, password string) error {
	if !caller.Can(models.FamilyAccountManage) {
		return models.ErrForbidden
	}
	if err := s.passwords.VerifyPassword(ctx, caller.FamilyID, password); err != nil {
		return err
	}
	err := s.inTx(ctx, func(_ pgx.Tx, r *Repository) error {
		if err := r.lockFamily(ctx, caller.FamilyID); err != nil {
			return err
		}
		target, err := r.getForUpdate(ctx, caller.FamilyID, to)
		if err != nil {
			return err
		}
		switch {
		case target.ID == caller.ProfileID:
			return models.ErrSelfNotAllowed
		case target.Role != models.Parent:
			return models.Invalid("profileId", "Ownership can only go to a PARENT profile.")
		}
		return r.moveOwner(ctx, caller.FamilyID, to)
	})
	if err != nil {
		return err
	}
	audit.Event(ctx, s.log, "family.owner_transferred", audit.Family(caller.FamilyID),
		audit.Actor(caller.ProfileID), audit.Profile(to))
	return nil
}

func (s *Service) Unlock(ctx context.Context, familyID, id uuid.UUID, pin *string) (Profile, error) {
	if pin != nil {
		if msg := checkPIN(*pin); msg != "" {
			return Profile{}, models.Invalid("pin", msg)
		}
	}
	var (
		p       Profile
		verdict error
	)
	err := s.inTx(ctx, func(_ pgx.Tx, r *Repository) error {
		var err error
		if p, err = r.getForUpdate(ctx, familyID, id); err != nil {
			return err
		}
		if !p.HasPin() {
			return nil
		}
		if pin == nil {
			return models.Invalid("pin", "Enter the PIN.")
		}
		verdict, err = s.checkPIN(ctx, r, p, *pin)
		return err
	})
	if err != nil {
		return Profile{}, err
	}
	return p, verdict
}

func (s *Service) checkPIN(ctx context.Context, r *Repository, p Profile, pin string) (verdict, err error) {
	now := s.now()
	// Read only after the row lock: a join would see the snapshot from before a concurrent guess committed.
	hasFailures, lockedUntil, err := r.pinAttempt(ctx, p.ID)
	if err != nil {
		return nil, err
	}
	if until := activeLock(lockedUntil, now); until != nil {
		return &models.RetryError{Locked: true, After: until.Sub(now)}, nil
	}
	ok, err := s.hasher.Matches(*p.pinHash, pin)
	if err != nil {
		return nil, err
	}
	if ok {
		if hasFailures {
			return nil, r.clearAttempts(ctx, p.ID)
		}
		return nil, nil
	}
	failures, err := r.recordFailure(ctx, p.ID, now)
	if err != nil {
		return nil, err
	}
	attrs := []slog.Attr{audit.Family(p.FamilyID), audit.Profile(p.ID), slog.Int("failed_count", int(failures))}
	audit.Event(ctx, s.log, "profile.pin_failed", attrs...)
	lock := lockoutAfter(failures)
	if lock == 0 {
		return models.ErrInvalidPIN, nil
	}
	if err := r.lockPin(ctx, p.ID, now.Add(lock)); err != nil {
		return nil, err
	}
	audit.Event(ctx, s.log, "profile.pin_locked", append(attrs, slog.Duration("locked_for", lock))...)
	return &models.RetryError{Locked: true, After: lock}, nil
}

func (s *Service) SetPIN(ctx context.Context, caller models.Caller, targetID uuid.UUID, in PINInput) error {
	fe := models.FieldErrors{}
	if in.Pin != nil {
		fe.Add("pin", checkPIN(*in.Pin))
	}
	if in.CurrentPin != nil {
		fe.Add("currentPin", checkPIN(*in.CurrentPin))
	}
	if err := fe.Err(); err != nil {
		return err
	}
	self := targetID == caller.ProfileID
	var (
		verdict error
		by      string
	)
	err := s.inTx(ctx, func(tx pgx.Tx, r *Repository) error {
		target, err := r.getForUpdate(ctx, caller.FamilyID, targetID)
		if err != nil {
			return err
		}
		switch {
		case self:
			by = "self"
			if target.HasPin() {
				if verdict, err = s.proveOwnPIN(ctx, r, caller, target, in); err != nil || verdict != nil {
					return err
				}
			}
		case target.Role == models.Child:
			by = "parent"
			if !caller.Can(models.FamilyPinsResetChild) {
				return models.ErrForbidden
			}
		default:
			by = "owner"
			if !caller.Can(models.FamilyPinsResetParent) {
				return models.ErrForbidden
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
		if err := r.setPin(ctx, target.FamilyID, target.ID, hash); err != nil {
			return err
		}
		if err := r.clearAttempts(ctx, target.ID); err != nil {
			return err
		}
		keep := []uuid.UUID{}
		if self {
			keep = append(keep, caller.SessionID)
		}
		return s.sessions.EndProfileSessions(ctx, tx, target.FamilyID, target.ID, keep)
	})
	if err != nil {
		return err
	}
	if verdict != nil {
		return verdict
	}
	audit.Event(ctx, s.log, "profile.pin_changed", audit.Family(caller.FamilyID), audit.Profile(targetID),
		audit.Actor(caller.ProfileID), slog.String("by", by))
	return nil
}

func (s *Service) proveOwnPIN(ctx context.Context, r *Repository, caller models.Caller, target Profile, in PINInput) (verdict, err error) {
	switch {
	case in.CurrentPin != nil:
		return s.checkPIN(ctx, r, target, *in.CurrentPin)
	case in.Password != nil:
		if caller.Role != models.Parent {
			return nil, models.ErrForbidden
		}
		return nil, s.passwords.VerifyPassword(ctx, caller.FamilyID, *in.Password)
	default:
		return nil, models.Invalid("currentPin", "Enter your current PIN.")
	}
}
