package meal

import (
	"fmt"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/validate"
)

const (
	maxNameChars           = 120
	maxDescriptionChars    = 2000
	maxCuisineChars        = 50
	maxServings            = 50
	maxIngredients         = 100
	maxIngredientNameChars = 80
	maxNoteChars           = 200
	maxInstructionsChars   = 20000
	maxRecipeMinutes       = 1440
	maxSourceURLChars      = 2048
	maxWholeNumber         = 1_000_000
	maxGrams               = 99_999
	maxMicroAmount         = 999_999
	minQuantity            = 0.001
	maxQuantity            = 999_999
)

var (
	units = []string{
		"g", "kg", "oz", "lb", "ml", "l", "tsp", "tbsp", "cup", "clove", "slice", "tin", "pack", "bunch", "pinch",
	}
	categories = []string{
		"produce", "meat", "fish", "dairy", "bakery", "tins", "dry_goods", "frozen", "drinks", "household", "other",
	}
	allergens = []string{
		"celery", "cereals_gluten", "crustaceans", "eggs", "fish", "lupin", "milk", "molluscs",
		"mustard", "peanuts", "sesame", "soya", "sulphites", "tree_nuts",
	}
	dietaryTags = []string{
		"vegetarian", "vegan", "pescatarian", "gluten_free", "dairy_free", "nut_free", "halal", "kosher",
	}
	nutrients = []string{
		"vitamin_a", "vitamin_c", "vitamin_d", "vitamin_e", "vitamin_k", "vitamin_b6", "vitamin_b12",
		"folate", "calcium", "iron", "magnesium", "potassium", "zinc",
	}
)

type Meal struct {
	ID uuid.UUID
	Content
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Content struct {
	Name        string
	Description string
	Servings    *int
	Cuisine     *string
	Allergens   []string
	DietaryTags []string
	Macros      Macros
	Micros      []Micro
	CostPence   *int
	Ingredients []Ingredient
	Recipe      *Recipe
}

type Macros struct {
	Calories      *int
	ProteinG      *float64
	CarbsG        *float64
	SugarG        *float64
	FatG          *float64
	SaturatedFatG *float64
	FibreG        *float64
	SaltG         *float64
}

type Micro struct {
	Nutrient string
	Amount   float64
}

type Ingredient struct {
	Quantity *float64
	Unit     *string
	Name     string
	Note     string
	Category *string
}

type Recipe struct {
	Instructions string
	PrepMinutes  *int
	CookMinutes  *int
	SourceURL    *string
}

type Summary struct {
	ID          uuid.UUID
	Name        string
	Servings    *int
	Cuisine     *string
	Allergens   []string
	DietaryTags []string
	Calories    *int
	CostPence   *int
	HasRecipe   bool
	PrepMinutes *int
	CookMinutes *int
}

func (c *Content) normalise() error {
	fe := validate.Fields{}
	var msg string
	c.Name, msg = validate.Name(c.Name, maxNameChars)
	fe.Add("name", msg)
	c.Description = strings.TrimSpace(c.Description)
	fe.Add("description", maxChars(c.Description, maxDescriptionChars))
	fe.Add("servings", intRange(c.Servings, 1, maxServings))
	c.Cuisine = blankToNil(c.Cuisine)
	if c.Cuisine != nil {
		fe.Add("cuisine", maxChars(*c.Cuisine, maxCuisineChars))
	}
	c.Allergens = orEmpty(c.Allergens)
	c.DietaryTags = orEmpty(c.DietaryTags)
	checkChoices(fe, "allergens", c.Allergens, allergens)
	checkChoices(fe, "dietaryTags", c.DietaryTags, dietaryTags)
	c.Macros.check(fe)
	fe.Add("costPence", intRange(c.CostPence, 0, maxWholeNumber))
	checkMicros(fe, c.Micros)
	if len(c.Ingredients) > maxIngredients {
		fe.Add("ingredients", fmt.Sprintf("Use at most %d ingredients.", maxIngredients))
	}
	for i := range c.Ingredients {
		c.Ingredients[i].normalise(fe, "ingredients."+strconv.Itoa(i)+".")
	}
	if c.Recipe != nil {
		c.Recipe.normalise(fe)
	}
	return fe.Err()
}

func (m Macros) check(fe validate.Fields) {
	fe.Add("macros.calories", intRange(m.Calories, 0, maxWholeNumber))
	for field, v := range map[string]*float64{
		"proteinG": m.ProteinG, "carbsG": m.CarbsG, "sugarG": m.SugarG, "fatG": m.FatG,
		"saturatedFatG": m.SaturatedFatG, "fibreG": m.FibreG, "saltG": m.SaltG,
	} {
		if v != nil {
			fe.Add("macros."+field, floatRange(*v, 0, maxGrams))
		}
	}
}

func checkMicros(fe validate.Fields, micros []Micro) {
	seen := make(map[string]bool, len(micros))
	for i, m := range micros {
		path := "micros." + strconv.Itoa(i) + "."
		switch {
		case !slices.Contains(nutrients, m.Nutrient):
			fe.Add(path+"nutrient", "Choose a nutrient from the list.")
		case seen[m.Nutrient]:
			fe.Add(path+"nutrient", "This nutrient is already listed.")
		}
		seen[m.Nutrient] = true
		fe.Add(path+"amount", floatRange(m.Amount, 0, maxMicroAmount))
	}
}

func (in *Ingredient) normalise(fe validate.Fields, path string) {
	var msg string
	in.Name, msg = validate.Name(in.Name, maxIngredientNameChars)
	fe.Add(path+"name", msg)
	if in.Quantity != nil {
		fe.Add(path+"quantity", floatRange(*in.Quantity, minQuantity, maxQuantity))
	}
	switch {
	case in.Unit != nil && !slices.Contains(units, *in.Unit):
		fe.Add(path+"unit", "Choose a unit from the list.")
	case in.Unit != nil && in.Quantity == nil:
		fe.Add(path+"unit", "Enter a quantity to go with the unit.")
	}
	in.Note = strings.TrimSpace(in.Note)
	fe.Add(path+"note", maxChars(in.Note, maxNoteChars))
	if in.Category != nil && !slices.Contains(categories, *in.Category) {
		fe.Add(path+"category", "Choose a category from the list.")
	}
}

func (r *Recipe) normalise(fe validate.Fields) {
	r.Instructions = strings.TrimSpace(r.Instructions)
	fe.Add("recipe.instructions", maxChars(r.Instructions, maxInstructionsChars))
	fe.Add("recipe.prepMinutes", intRange(r.PrepMinutes, 0, maxRecipeMinutes))
	fe.Add("recipe.cookMinutes", intRange(r.CookMinutes, 0, maxRecipeMinutes))
	r.SourceURL = blankToNil(r.SourceURL)
	if r.SourceURL != nil {
		fe.Add("recipe.sourceUrl", checkLink(*r.SourceURL))
	}
}

func normaliseIngredientSearch(q string) (string, error) {
	q = strings.TrimSpace(q)
	switch n := utf8.RuneCountInString(q); {
	case n == 0:
		return "", models.Invalid("q", "Enter some text to search for.")
	case n > maxIngredientNameChars:
		return "", models.Invalid("q", fmt.Sprintf("Use at most %d characters.", maxIngredientNameChars))
	}
	return q, nil
}

func checkLink(raw string) string {
	if utf8.RuneCountInString(raw) > maxSourceURLChars {
		return fmt.Sprintf("Use at most %d characters.", maxSourceURLChars)
	}
	u, err := url.Parse(raw)
	if err != nil || (!strings.EqualFold(u.Scheme, "http") && !strings.EqualFold(u.Scheme, "https")) || u.Host == "" {
		return "Enter a link starting with http:// or https://."
	}
	return ""
}

func checkChoices(fe validate.Fields, field string, values, allowed []string) {
	for i, v := range values {
		path := field + "." + strconv.Itoa(i)
		switch {
		case !slices.Contains(allowed, v):
			fe.Add(path, "Choose a value from the list.")
		case slices.Contains(values[:i], v):
			fe.Add(path, "This value is already listed.")
		}
	}
}

func maxChars(s string, limit int) string {
	if utf8.RuneCountInString(s) > limit {
		return fmt.Sprintf("Use at most %d characters.", limit)
	}
	return ""
}

func intRange(v *int, lowest, highest int) string {
	if v != nil && (*v < lowest || *v > highest) {
		return fmt.Sprintf("Enter a whole number from %d to %d.", lowest, highest)
	}
	return ""
}

func floatRange(v, lowest, highest float64) string {
	if v < lowest || v > highest {
		return fmt.Sprintf("Enter a number from %g to %g.", lowest, highest)
	}
	return ""
}

func orEmpty(values []string) []string {
	if values == nil {
		return []string{}
	}
	return values
}

func blankToNil(s *string) *string {
	if s == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*s)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
