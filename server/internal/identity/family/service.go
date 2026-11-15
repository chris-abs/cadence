package family

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/audit"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/ratelimit"
	"github.com/chris-abs/cadence/server/internal/platform/validate"
)

type Service struct {
	repo   *Repository
	hasher passhash.Hasher
	log    *slog.Logger
	reauth *ratelimit.Limiter
}

func NewService(pool *pgxpool.Pool, hasher passhash.Hasher, now func() time.Time, log *slog.Logger) *Service {
	return &Service{
		repo:   NewRepository(pool),
		hasher: hasher,
		log:    log,
		reauth: ratelimit.New(3*time.Minute, 5, now),
	}
}

func (s *Service) Exists(ctx context.Context) (bool, error) {
	return s.repo.Exists(ctx)
}

func (s *Service) Find(ctx context.Context, id uuid.UUID) (Family, error) {
	return s.repo.Get(ctx, id)
}

func (s *Service) FindByEmail(ctx context.Context, email string) (Family, error) {
	return s.repo.GetByEmail(ctx, email)
}

func (s *Service) Get(ctx context.Context, caller models.Caller) (Family, error) {
	if !caller.Can(models.FamilyView) {
		return Family{}, models.ErrForbidden
	}
	return s.repo.Get(ctx, caller.FamilyID)
}

func (s *Service) Update(ctx context.Context, caller models.Caller, name string, autoLockMinutes int) (Family, error) {
	if !caller.Can(models.FamilyEdit) {
		return Family{}, models.ErrForbidden
	}
	fe := validate.Fields{}
	name, msg := NormalizeName(name)
	fe.Add("name", msg)
	fe.Add("autoLockMinutes", checkAutoLock(autoLockMinutes))
	if err := fe.Err(); err != nil {
		return Family{}, err
	}
	return s.repo.UpdateSettings(ctx, caller.FamilyID, name, int16(autoLockMinutes)) //nolint:gosec // range-checked to 1–30 above.
}

func (s *Service) ChangeEmail(ctx context.Context, caller models.Caller, email, password string) (Family, error) {
	if !caller.Can(models.FamilyAccountManage) {
		return Family{}, models.ErrForbidden
	}
	email, msg := validate.Email(email)
	if msg != "" {
		return Family{}, models.Invalid("email", msg)
	}
	if err := s.VerifyPassword(ctx, caller.FamilyID, password); err != nil {
		return Family{}, err
	}
	f, err := s.repo.UpdateEmail(ctx, caller.FamilyID, email)
	if err != nil {
		return Family{}, err
	}
	audit.Event(ctx, s.log, "family.email_changed", audit.Family(f.ID), audit.Actor(caller.ProfileID))
	return f, nil
}

func (s *Service) Delete(ctx context.Context, caller models.Caller, password, confirmName string) error {
	if !caller.Can(models.FamilyAccountManage) {
		return models.ErrForbidden
	}
	f, err := s.repo.Get(ctx, caller.FamilyID)
	if err != nil {
		return err
	}
	if err := s.verify(ctx, f, password); err != nil {
		return err
	}
	if !strings.EqualFold(strings.TrimSpace(confirmName), f.Name) {
		return models.Invalid("confirmName", "Type the family name exactly as shown.")
	}
	if err := s.repo.Delete(ctx, f.ID); err != nil {
		return err
	}
	audit.Event(ctx, s.log, "family.deleted", audit.Family(f.ID), audit.Actor(caller.ProfileID))
	return nil
}

func (s *Service) VerifyPassword(ctx context.Context, familyID uuid.UUID, password string) error {
	f, err := s.repo.Get(ctx, familyID)
	if err != nil {
		return err
	}
	return s.verify(ctx, f, password)
}

func (s *Service) verify(ctx context.Context, f Family, password string) error {
	key := f.ID.String()
	if ok, wait := s.reauth.Check(key); !ok {
		audit.Event(ctx, s.log, "auth.rate_limited", slog.String("limit", "reauth_per_family"), audit.Family(f.ID))
		return &models.RetryError{After: wait}
	}
	ok, err := s.hasher.Matches(f.PasswordHash, password)
	if err != nil {
		return err
	}
	if !ok {
		s.reauth.Fail(key)
		return models.ErrInvalidPassword
	}
	return nil
}

func (s *Service) Modules(ctx context.Context, familyID uuid.UUID) ([]ModuleState, error) {
	settings, err := s.repo.ModuleSettings(ctx, familyID)
	if err != nil {
		return nil, err
	}
	return moduleStates(settings), nil
}

func (s *Service) EnabledModules(ctx context.Context, familyID uuid.UUID) ([]models.Module, error) {
	states, err := s.Modules(ctx, familyID)
	if err != nil {
		return nil, err
	}
	var enabled []models.Module
	for _, m := range states {
		if m.Enabled {
			enabled = append(enabled, m.Module)
		}
	}
	return enabled, nil
}

func (s *Service) SetModule(ctx context.Context, caller models.Caller, id string, enabled bool) (ModuleState, error) {
	if !caller.Can(models.FamilyModulesManage) {
		return ModuleState{}, models.ErrForbidden
	}
	m, ok := lookupModule(id)
	if !ok {
		return ModuleState{}, models.ErrNotFound
	}
	if err := s.repo.SetModule(ctx, caller.FamilyID, id, enabled); err != nil {
		return ModuleState{}, err
	}
	audit.Event(ctx, s.log, "family.module_toggled", audit.Family(caller.FamilyID), audit.Actor(caller.ProfileID),
		slog.String("module", id), slog.Bool("enabled", enabled))
	return ModuleState{Module: m, Enabled: enabled}, nil
}
