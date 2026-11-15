package profile

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/db"
	"github.com/chris-abs/cadence/server/internal/profile/internal/profiledb"
)

const constraintName = "profile_family_name"

type Repository struct {
	q *profiledb.Queries
}

func NewRepository(conn db.DBTX) *Repository {
	return &Repository{q: profiledb.New(conn)}
}

func (r *Repository) lockFamily(ctx context.Context, familyID uuid.UUID) error {
	if err := r.q.LockFamilyProfiles(ctx, familyID.String()); err != nil {
		return fmt.Errorf("lock family profiles: %w", err)
	}
	return nil
}

func (r *Repository) Create(ctx context.Context, p NewProfile) (Profile, error) {
	row, err := r.q.CreateProfile(ctx, profiledb.CreateProfileParams{
		ID: p.ID, FamilyID: p.FamilyID, Name: p.Name, Role: string(p.Role), IsOwner: p.IsOwner,
		Colour: p.Colour, Avatar: p.Avatar, Timezone: p.Timezone, PinHash: p.PinHash, ContactEmail: p.ContactEmail,
	})
	if db.IsUniqueViolation(err, constraintName) {
		return Profile{}, models.ErrNameTaken
	}
	if err != nil {
		return Profile{}, fmt.Errorf("create profile: %w", err)
	}
	return fromRow(row, nil), nil
}

func (r *Repository) list(ctx context.Context, familyID uuid.UUID) ([]Profile, error) {
	rows, err := r.q.ListProfiles(ctx, familyID)
	if err != nil {
		return nil, fmt.Errorf("list profiles: %w", err)
	}
	out := make([]Profile, len(rows))
	for i, row := range rows {
		out[i] = fromRow(row.Profile, row.LockedUntil)
	}
	return out, nil
}

func (r *Repository) get(ctx context.Context, familyID, id uuid.UUID) (Profile, error) {
	row, err := r.q.GetProfile(ctx, profiledb.GetProfileParams{FamilyID: familyID, ID: id})
	if err != nil {
		return Profile{}, notFound(err, "load profile")
	}
	return fromRow(row.Profile, row.LockedUntil), nil
}

func (r *Repository) getForUpdate(ctx context.Context, familyID, id uuid.UUID) (Profile, error) {
	row, err := r.q.GetProfileForUpdate(ctx, profiledb.GetProfileForUpdateParams{FamilyID: familyID, ID: id})
	if err != nil {
		return Profile{}, notFound(err, "load profile")
	}
	return fromRow(row, nil), nil
}

func (r *Repository) pinAttempt(ctx context.Context, id uuid.UUID) (found bool, lockedUntil *time.Time, err error) {
	row, err := r.q.GetPinAttempt(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil, nil
	}
	if err != nil {
		return false, nil, fmt.Errorf("load pin attempts: %w", err)
	}
	return true, row.LockedUntil, nil
}

func (r *Repository) count(ctx context.Context, familyID uuid.UUID) (int64, error) {
	n, err := r.q.CountProfiles(ctx, familyID)
	if err != nil {
		return 0, fmt.Errorf("count profiles: %w", err)
	}
	return n, nil
}

func (r *Repository) hasChild(ctx context.Context, familyID uuid.UUID) (bool, error) {
	ok, err := r.q.FamilyHasChild(ctx, familyID)
	if err != nil {
		return false, fmt.Errorf("check for child profiles: %w", err)
	}
	return ok, nil
}

func (r *Repository) updateDisplay(ctx context.Context, familyID, id uuid.UUID, name, colour string, avatar *string, tz string, contact *string) (Profile, error) {
	row, err := r.q.UpdateProfileDisplay(ctx, profiledb.UpdateProfileDisplayParams{
		Name: name, Colour: colour, Avatar: avatar, Timezone: tz, ContactEmail: contact, FamilyID: familyID, ID: id,
	})
	if db.IsUniqueViolation(err, constraintName) {
		return Profile{}, models.ErrNameTaken
	}
	if err != nil {
		return Profile{}, notFound(err, "update profile")
	}
	return fromRow(row, nil), nil
}

func (r *Repository) updateRole(ctx context.Context, familyID, id uuid.UUID, role string) (Profile, error) {
	row, err := r.q.UpdateProfileRole(ctx, profiledb.UpdateProfileRoleParams{Role: role, FamilyID: familyID, ID: id})
	if err != nil {
		return Profile{}, fmt.Errorf("update role: %w", err)
	}
	return fromRow(row, nil), nil
}

func (r *Repository) setPin(ctx context.Context, familyID, id uuid.UUID, hash *string) error {
	if err := r.q.SetProfilePin(ctx, profiledb.SetProfilePinParams{PinHash: hash, FamilyID: familyID, ID: id}); err != nil {
		return fmt.Errorf("set pin: %w", err)
	}
	return nil
}

func (r *Repository) delete(ctx context.Context, familyID, id uuid.UUID) error {
	if err := r.q.DeleteProfile(ctx, profiledb.DeleteProfileParams{FamilyID: familyID, ID: id}); err != nil {
		return fmt.Errorf("delete profile: %w", err)
	}
	return nil
}

func (r *Repository) moveOwner(ctx context.Context, familyID, to uuid.UUID) error {
	if err := r.q.ClearOwner(ctx, familyID); err != nil {
		return fmt.Errorf("clear owner: %w", err)
	}
	if err := r.q.SetOwner(ctx, profiledb.SetOwnerParams{FamilyID: familyID, ID: to}); err != nil {
		return fmt.Errorf("set owner: %w", err)
	}
	return nil
}

func (r *Repository) recordFailure(ctx context.Context, id uuid.UUID, now time.Time) (int32, error) {
	n, err := r.q.RecordPinFailure(ctx, profiledb.RecordPinFailureParams{ProfileID: id, Now: now})
	if err != nil {
		return 0, fmt.Errorf("record pin failure: %w", err)
	}
	return n, nil
}

func (r *Repository) lockPin(ctx context.Context, id uuid.UUID, until time.Time) error {
	if err := r.q.LockPin(ctx, profiledb.LockPinParams{ProfileID: id, LockedUntil: &until}); err != nil {
		return fmt.Errorf("lock pin: %w", err)
	}
	return nil
}

func (r *Repository) clearAttempts(ctx context.Context, id uuid.UUID) error {
	if err := r.q.ClearPinAttempts(ctx, id); err != nil {
		return fmt.Errorf("clear pin attempts: %w", err)
	}
	return nil
}

func fromRow(p profiledb.Profile, lockedUntil *time.Time) Profile {
	return Profile{
		ID: p.ID, FamilyID: p.FamilyID, Name: p.Name, Role: models.Role(p.Role), IsOwner: p.IsOwner,
		Colour: p.Colour, Avatar: p.Avatar, Timezone: p.Timezone, ContactEmail: p.ContactEmail,
		ContactEmailVerifiedAt: p.ContactEmailVerifiedAt, CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt,
		LockedUntil: lockedUntil, pinHash: p.PinHash,
	}
}

func notFound(err error, what string) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return models.ErrNotFound
	}
	return fmt.Errorf("%s: %w", what, err)
}
