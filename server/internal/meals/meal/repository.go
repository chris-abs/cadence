package meal

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/meals/meal/internal/mealdb"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/db"
)

type Repository struct {
	q *mealdb.Queries
}

func newRepository(conn mealdb.DBTX) *Repository {
	return &Repository{q: mealdb.New(conn)}
}

func (r *Repository) list(ctx context.Context, familyID uuid.UUID, q string) ([]Summary, error) {
	rows, err := r.q.ListMeals(ctx, mealdb.ListMealsParams{FamilyID: familyID, Q: q})
	if err != nil {
		return nil, fmt.Errorf("list meals: %w", err)
	}
	out := make([]Summary, len(rows))
	for i, row := range rows {
		out[i] = Summary{
			ID: row.ID, Name: row.Name, Servings: row.Servings, Cuisine: row.Cuisine,
			Allergens: row.Allergens, DietaryTags: row.DietaryTags, Calories: row.Calories,
			CostPence: row.CostPence, HasRecipe: row.HasRecipe, PrepMinutes: row.PrepMinutes, CookMinutes: row.CookMinutes,
		}
	}
	return out, nil
}

func (r *Repository) get(ctx context.Context, familyID, id uuid.UUID) (Meal, error) {
	row, err := r.q.GetMeal(ctx, mealdb.GetMealParams{FamilyID: familyID, ID: id})
	if errors.Is(err, pgx.ErrNoRows) {
		return Meal{}, models.ErrNotFound
	}
	if err != nil {
		return Meal{}, fmt.Errorf("load meal: %w", err)
	}
	ingredients, err := r.q.ListIngredients(ctx, mealdb.ListIngredientsParams{FamilyID: familyID, MealID: id})
	if err != nil {
		return Meal{}, fmt.Errorf("load meal ingredients: %w", err)
	}
	nutrients, err := r.q.ListNutrients(ctx, mealdb.ListNutrientsParams{FamilyID: familyID, MealID: id})
	if err != nil {
		return Meal{}, fmt.Errorf("load meal nutrients: %w", err)
	}
	return fromRows(row, ingredients, nutrients), nil
}

func (r *Repository) create(ctx context.Context, familyID, createdBy, id uuid.UUID, c Content) error {
	err := r.q.CreateMeal(ctx, mealdb.CreateMealParams{
		ID: id, FamilyID: familyID, Name: c.Name, Description: c.Description, Servings: c.Servings,
		Cuisine: c.Cuisine, Allergens: c.Allergens, DietaryTags: c.DietaryTags, Calories: c.Macros.Calories,
		ProteinG: c.Macros.ProteinG, CarbsG: c.Macros.CarbsG, SugarG: c.Macros.SugarG, FatG: c.Macros.FatG,
		SaturatedFatG: c.Macros.SaturatedFatG, FibreG: c.Macros.FibreG, SaltG: c.Macros.SaltG,
		CostPence: c.CostPence, CreatedBy: &createdBy,
	})
	if err != nil {
		return fmt.Errorf("create meal: %w", err)
	}
	return r.addContents(ctx, familyID, id, c)
}

func (r *Repository) update(ctx context.Context, familyID, id uuid.UUID, c Content) error {
	n, err := r.q.UpdateMeal(ctx, mealdb.UpdateMealParams{
		ID: id, FamilyID: familyID, Name: c.Name, Description: c.Description, Servings: c.Servings,
		Cuisine: c.Cuisine, Allergens: c.Allergens, DietaryTags: c.DietaryTags, Calories: c.Macros.Calories,
		ProteinG: c.Macros.ProteinG, CarbsG: c.Macros.CarbsG, SugarG: c.Macros.SugarG, FatG: c.Macros.FatG,
		SaturatedFatG: c.Macros.SaturatedFatG, FibreG: c.Macros.FibreG, SaltG: c.Macros.SaltG,
		CostPence: c.CostPence,
	})
	if err != nil {
		return fmt.Errorf("update meal: %w", err)
	}
	if n == 0 {
		return models.ErrNotFound
	}
	if err := r.q.ClearMealContents(ctx, mealdb.ClearMealContentsParams{FamilyID: familyID, MealID: id}); err != nil {
		return fmt.Errorf("clear meal contents: %w", err)
	}
	return r.addContents(ctx, familyID, id, c)
}

func (r *Repository) delete(ctx context.Context, familyID, id uuid.UUID) error {
	n, err := r.q.DeleteMeal(ctx, mealdb.DeleteMealParams{FamilyID: familyID, ID: id})
	if err != nil {
		return fmt.Errorf("delete meal: %w", err)
	}
	if n == 0 {
		return models.ErrNotFound
	}
	return nil
}

func (r *Repository) ingredientNames(ctx context.Context, familyID uuid.UUID, q string) ([]string, error) {
	names, err := r.q.ListIngredientNames(ctx, mealdb.ListIngredientNamesParams{FamilyID: familyID, Q: q})
	if err != nil {
		return nil, fmt.Errorf("list ingredient names: %w", err)
	}
	return names, nil
}

func (r *Repository) addContents(ctx context.Context, familyID, mealID uuid.UUID, c Content) error {
	if len(c.Ingredients) > 0 {
		rows := make([]mealdb.CreateIngredientsParams, len(c.Ingredients))
		for i, in := range c.Ingredients {
			id, err := db.NewID()
			if err != nil {
				return err
			}
			rows[i] = mealdb.CreateIngredientsParams{
				ID: id, FamilyID: familyID, MealID: mealID, Position: i, Quantity: in.Quantity,
				Unit: in.Unit, Name: in.Name, Note: in.Note, Category: in.Category,
			}
		}
		if _, err := r.q.CreateIngredients(ctx, rows); err != nil {
			return fmt.Errorf("add meal ingredients: %w", err)
		}
	}
	if len(c.Micros) > 0 {
		rows := make([]mealdb.CreateNutrientsParams, len(c.Micros))
		for i, m := range c.Micros {
			id, err := db.NewID()
			if err != nil {
				return err
			}
			rows[i] = mealdb.CreateNutrientsParams{ID: id, FamilyID: familyID, MealID: mealID, Nutrient: m.Nutrient, Amount: m.Amount}
		}
		if _, err := r.q.CreateNutrients(ctx, rows); err != nil {
			return fmt.Errorf("add meal nutrients: %w", err)
		}
	}
	if c.Recipe == nil {
		return nil
	}
	id, err := db.NewID()
	if err != nil {
		return err
	}
	err = r.q.CreateRecipe(ctx, mealdb.CreateRecipeParams{
		ID: id, FamilyID: familyID, MealID: mealID, Instructions: c.Recipe.Instructions,
		PrepMinutes: c.Recipe.PrepMinutes, CookMinutes: c.Recipe.CookMinutes, SourceUrl: c.Recipe.SourceURL,
	})
	if err != nil {
		return fmt.Errorf("add recipe: %w", err)
	}
	return nil
}

func fromRows(row mealdb.GetMealRow, ingredients []mealdb.MealIngredient, nutrients []mealdb.MealNutrient) Meal {
	m := row.Meal
	out := Meal{
		ID: m.ID, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
		Content: Content{
			Name: m.Name, Description: m.Description, Servings: m.Servings, Cuisine: m.Cuisine,
			Allergens: m.Allergens, DietaryTags: m.DietaryTags, CostPence: m.CostPence,
			Macros: Macros{
				Calories: m.Calories, ProteinG: m.ProteinG, CarbsG: m.CarbsG, SugarG: m.SugarG, FatG: m.FatG,
				SaturatedFatG: m.SaturatedFatG, FibreG: m.FibreG, SaltG: m.SaltG,
			},
			Ingredients: make([]Ingredient, len(ingredients)),
			Micros:      make([]Micro, len(nutrients)),
		},
	}
	for i, in := range ingredients {
		out.Ingredients[i] = Ingredient{Quantity: in.Quantity, Unit: in.Unit, Name: in.Name, Note: in.Note, Category: in.Category}
	}
	for i, n := range nutrients {
		out.Micros[i] = Micro{Nutrient: n.Nutrient, Amount: n.Amount}
	}
	if row.RecipeID != nil {
		out.Recipe = &Recipe{
			Instructions: *row.Instructions, PrepMinutes: row.PrepMinutes,
			CookMinutes: row.CookMinutes, SourceURL: row.SourceUrl,
		}
	}
	return out
}
