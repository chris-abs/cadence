package meal

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/db"
)

const (
	permView = "meals.view"
	permEdit = "meals.recipes.edit"
)

type Service struct {
	pool *pgxpool.Pool
	repo *Repository
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool, repo: newRepository(pool)}
}

func (s *Service) inTx(ctx context.Context, fn func(*Repository) error) error {
	return db.InTx(ctx, s.pool, func(tx pgx.Tx) error { return fn(newRepository(tx)) })
}

func (s *Service) List(ctx context.Context, caller models.Caller, q string) ([]Summary, error) {
	if !caller.Can(permView) {
		return nil, models.ErrForbidden
	}
	return s.repo.list(ctx, caller.FamilyID, strings.TrimSpace(q))
}

func (s *Service) Get(ctx context.Context, caller models.Caller, id uuid.UUID) (Meal, error) {
	if !caller.Can(permView) {
		return Meal{}, models.ErrForbidden
	}
	return s.repo.get(ctx, caller.FamilyID, id)
}

func (s *Service) Create(ctx context.Context, caller models.Caller, c Content) (Meal, error) {
	if !caller.Can(permEdit) {
		return Meal{}, models.ErrForbidden
	}
	if err := c.normalise(); err != nil {
		return Meal{}, err
	}
	id, err := db.NewID()
	if err != nil {
		return Meal{}, err
	}
	var m Meal
	err = s.inTx(ctx, func(repo *Repository) error {
		if err := repo.create(ctx, caller.FamilyID, caller.ProfileID, id, c); err != nil {
			return err
		}
		var err error
		m, err = repo.get(ctx, caller.FamilyID, id)
		return err
	})
	return m, err
}

func (s *Service) Update(ctx context.Context, caller models.Caller, id uuid.UUID, c Content) (Meal, error) {
	if !caller.Can(permEdit) {
		return Meal{}, models.ErrForbidden
	}
	if err := c.normalise(); err != nil {
		return Meal{}, err
	}
	var m Meal
	err := s.inTx(ctx, func(repo *Repository) error {
		if err := repo.update(ctx, caller.FamilyID, id, c); err != nil {
			return err
		}
		var err error
		m, err = repo.get(ctx, caller.FamilyID, id)
		return err
	})
	return m, err
}

func (s *Service) Delete(ctx context.Context, caller models.Caller, id uuid.UUID) error {
	if !caller.Can(permEdit) {
		return models.ErrForbidden
	}
	return s.repo.delete(ctx, caller.FamilyID, id)
}

func (s *Service) IngredientNames(ctx context.Context, caller models.Caller, q string) ([]string, error) {
	if !caller.Can(permView) {
		return nil, models.ErrForbidden
	}
	q, err := normaliseIngredientSearch(q)
	if err != nil {
		return nil, err
	}
	return s.repo.ingredientNames(ctx, caller.FamilyID, q)
}
