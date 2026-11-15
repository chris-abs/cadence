package family

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/family/internal/familydb"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/db"
)

type Repository struct {
	q *familydb.Queries
}

func NewRepository(conn db.DBTX) *Repository {
	return &Repository{q: familydb.New(conn)}
}

func (r *Repository) Exists(ctx context.Context) (bool, error) {
	exists, err := r.q.FamilyExists(ctx)
	if err != nil {
		return false, fmt.Errorf("check for families: %w", err)
	}
	return exists, nil
}

func (r *Repository) Create(ctx context.Context, f NewFamily) (Family, error) {
	row, err := r.q.CreateFamily(ctx, familydb.CreateFamilyParams{ID: f.ID, Name: f.Name, Email: f.Email, PasswordHash: f.PasswordHash})
	if db.IsUniqueViolation(err, "family_email_key") {
		return Family{}, models.ErrEmailTaken
	}
	if err != nil {
		return Family{}, fmt.Errorf("create family: %w", err)
	}
	return fromRow(row), nil
}

func (r *Repository) Get(ctx context.Context, id uuid.UUID) (Family, error) {
	row, err := r.q.GetFamily(ctx, id)
	if err != nil {
		return Family{}, notFound(err, "load family")
	}
	return fromRow(row), nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (Family, error) {
	row, err := r.q.GetFamilyByEmail(ctx, email)
	if err != nil {
		return Family{}, notFound(err, "load family by email")
	}
	return fromRow(row), nil
}

func (r *Repository) UpdateSettings(ctx context.Context, id uuid.UUID, name string, autoLockMinutes int16) (Family, error) {
	row, err := r.q.UpdateFamilySettings(ctx, familydb.UpdateFamilySettingsParams{Name: name, AutoLockMinutes: autoLockMinutes, ID: id})
	if err != nil {
		return Family{}, fmt.Errorf("update family: %w", err)
	}
	return fromRow(row), nil
}

func (r *Repository) UpdateEmail(ctx context.Context, id uuid.UUID, email string) (Family, error) {
	row, err := r.q.UpdateFamilyEmail(ctx, familydb.UpdateFamilyEmailParams{Email: email, ID: id})
	if db.IsUniqueViolation(err, "family_email_key") {
		return Family{}, models.ErrEmailTaken
	}
	if err != nil {
		return Family{}, fmt.Errorf("update family email: %w", err)
	}
	return fromRow(row), nil
}

func (r *Repository) UpdatePassword(ctx context.Context, id uuid.UUID, hash string) error {
	if err := r.q.UpdateFamilyPassword(ctx, familydb.UpdateFamilyPasswordParams{PasswordHash: hash, ID: id}); err != nil {
		return fmt.Errorf("update password: %w", err)
	}
	return nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.q.DeleteFamily(ctx, id); err != nil {
		return fmt.Errorf("delete family: %w", err)
	}
	return nil
}

func (r *Repository) ModuleSettings(ctx context.Context, familyID uuid.UUID) (map[string]bool, error) {
	rows, err := r.q.ListFamilyModules(ctx, familyID)
	if err != nil {
		return nil, fmt.Errorf("load module settings: %w", err)
	}
	settings := make(map[string]bool, len(rows))
	for _, row := range rows {
		settings[row.ModuleID] = row.Enabled
	}
	return settings, nil
}

func (r *Repository) SetModule(ctx context.Context, familyID uuid.UUID, moduleID string, enabled bool) error {
	if err := r.q.SetFamilyModule(ctx, familydb.SetFamilyModuleParams{FamilyID: familyID, ModuleID: moduleID, Enabled: enabled}); err != nil {
		return fmt.Errorf("set module: %w", err)
	}
	return nil
}

func fromRow(f familydb.Family) Family {
	return Family{
		ID: f.ID, Name: f.Name, Email: f.Email, PasswordHash: f.PasswordHash, PasswordChangedAt: f.PasswordChangedAt,
		AutoLockMinutes: int(f.AutoLockMinutes), CreatedAt: f.CreatedAt, UpdatedAt: f.UpdatedAt,
	}
}

func notFound(err error, what string) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return models.ErrNotFound
	}
	return fmt.Errorf("%s: %w", what, err)
}
