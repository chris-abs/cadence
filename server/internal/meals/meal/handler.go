package meal

import (
	"net/http"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	meals, err := h.svc.List(r.Context(), caller, r.URL.Query().Get("q"))
	if err != nil {
		return err
	}
	out := make([]api.MealSummary, len(meals))
	for i, m := range meals {
		out[i] = SummaryView(m)
	}
	return httpx.WriteJSON(w, http.StatusOK, api.MealList{Meals: out})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	m, err := h.svc.Get(r.Context(), caller, id)
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(m))
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	var body api.SaveMealRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	m, err := h.svc.Create(r.Context(), caller, contentFrom(body))
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusCreated, View(m))
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	var body api.SaveMealRequest
	if err := httpx.DecodeJSON(w, r, &body, 0); err != nil {
		return err
	}
	m, err := h.svc.Update(r.Context(), caller, id, contentFrom(body))
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, View(m))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	id, err := pathID(r)
	if err != nil {
		return err
	}
	if err := h.svc.Delete(r.Context(), caller, id); err != nil {
		return err
	}
	return httpx.NoContent(w)
}

func (h *Handler) IngredientNames(w http.ResponseWriter, r *http.Request) error {
	caller, _ := models.CallerFrom(r.Context())
	names, err := h.svc.IngredientNames(r.Context(), caller, r.URL.Query().Get("q"))
	if err != nil {
		return err
	}
	return httpx.WriteJSON(w, http.StatusOK, api.IngredientNameList{Names: names})
}

func pathID(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(r.PathValue("mealId"))
	if err != nil {
		return uuid.UUID{}, models.ErrNotFound
	}
	return id, nil
}

func contentFrom(b api.SaveMealRequest) Content {
	c := Content{
		Name: b.Name, Description: deref(b.Description), Servings: b.Servings, Cuisine: b.Cuisine,
		Allergens: toStrings(deref(b.Allergens)), DietaryTags: toStrings(deref(b.DietaryTags)), CostPence: b.CostPence,
	}
	if b.Macros != nil {
		c.Macros = Macros{
			Calories: b.Macros.Calories, ProteinG: b.Macros.ProteinG, CarbsG: b.Macros.CarbsG,
			SugarG: b.Macros.SugarG, FatG: b.Macros.FatG, SaturatedFatG: b.Macros.SaturatedFatG,
			FibreG: b.Macros.FibreG, SaltG: b.Macros.SaltG,
		}
	}
	for _, m := range deref(b.Micros) {
		c.Micros = append(c.Micros, Micro{Nutrient: string(m.Nutrient), Amount: m.Amount})
	}
	for _, in := range deref(b.Ingredients) {
		c.Ingredients = append(c.Ingredients, Ingredient{
			Quantity: in.Quantity, Unit: (*string)(in.Unit), Name: in.Name, Note: deref(in.Note),
			Category: (*string)(in.Category),
		})
	}
	if b.Recipe != nil {
		c.Recipe = &Recipe{
			Instructions: deref(b.Recipe.Instructions), PrepMinutes: b.Recipe.PrepMinutes,
			CookMinutes: b.Recipe.CookMinutes, SourceURL: b.Recipe.SourceUrl,
		}
	}
	return c
}

func View(m Meal) api.Meal {
	v := api.Meal{
		Id: m.ID.String(), Name: m.Name, Description: m.Description, Servings: m.Servings, Cuisine: m.Cuisine,
		Allergens: toEnums[api.Allergen](m.Allergens), DietaryTags: toEnums[api.DietaryTag](m.DietaryTags),
		Macros: api.Macros{
			Calories: m.Macros.Calories, ProteinG: m.Macros.ProteinG, CarbsG: m.Macros.CarbsG,
			SugarG: m.Macros.SugarG, FatG: m.Macros.FatG, SaturatedFatG: m.Macros.SaturatedFatG,
			FibreG: m.Macros.FibreG, SaltG: m.Macros.SaltG,
		},
		Micros: make([]api.Micro, len(m.Micros)), CostPence: m.CostPence,
		Ingredients: make([]api.Ingredient, len(m.Ingredients)),
		CreatedAt:   m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	for i, mi := range m.Micros {
		v.Micros[i] = api.Micro{Nutrient: api.Nutrient(mi.Nutrient), Amount: mi.Amount}
	}
	for i, in := range m.Ingredients {
		v.Ingredients[i] = api.Ingredient{
			Quantity: in.Quantity, Unit: (*api.Unit)(in.Unit), Name: in.Name, Note: in.Note,
			Category: (*api.IngredientCategory)(in.Category),
		}
	}
	if m.Recipe != nil {
		v.Recipe = &api.Recipe{
			Instructions: m.Recipe.Instructions, PrepMinutes: m.Recipe.PrepMinutes,
			CookMinutes: m.Recipe.CookMinutes, SourceUrl: m.Recipe.SourceURL,
		}
	}
	return v
}

func SummaryView(m Summary) api.MealSummary {
	return api.MealSummary{
		Id: m.ID.String(), Name: m.Name, Servings: m.Servings, Cuisine: m.Cuisine,
		Allergens: toEnums[api.Allergen](m.Allergens), DietaryTags: toEnums[api.DietaryTag](m.DietaryTags),
		Calories: m.Calories, CostPence: m.CostPence, HasRecipe: m.HasRecipe,
		PrepMinutes: m.PrepMinutes, CookMinutes: m.CookMinutes,
	}
}

func deref[T any](p *T) T {
	var zero T
	if p == nil {
		return zero
	}
	return *p
}

func toStrings[T ~string](values []T) []string {
	out := make([]string, len(values))
	for i, v := range values {
		out[i] = string(v)
	}
	return out
}

func toEnums[T ~string](values []string) []T {
	out := make([]T, len(values))
	for i, v := range values {
		out[i] = T(v)
	}
	return out
}
