package meal_test

import (
	"log/slog"
	"net/http"
	"reflect"
	"slices"
	"strconv"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/identity/auth"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

const email = "family@example.com"

func newServer(t *testing.T) *testutil.Server {
	return testutil.NewServer(t, func(pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) (http.Handler, error) {
		return app.NewHandler(app.Deps{Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvTest, Registration: auth.RegistrationOpen, Now: now, Hasher: hasher})
	})
}

func parent(t *testing.T, srv *testutil.Server, email string) *testutil.Device {
	d := srv.Device(t)
	d.Register(email)
	return d
}

func create(t *testing.T, d *testutil.Device, body map[string]any) api.Meal {
	t.Helper()
	return testutil.Decode[api.Meal](t, d.Call(http.MethodPost, "/meals", body, http.StatusCreated))
}

func list(t *testing.T, d *testutil.Device, query string) []string {
	t.Helper()
	meals := testutil.Decode[api.MealList](t, d.Call(http.MethodGet, "/meals"+query, nil, http.StatusOK)).Meals
	names := make([]string, len(meals))
	for i, m := range meals {
		names[i] = m.Name
	}
	return names
}

func fieldErrors(t *testing.T, d *testutil.Device, method, path string, body any) map[string]string {
	t.Helper()
	rec := d.Do(method, path, body)
	d.Expect(rec, http.StatusUnprocessableEntity, "validation_failed")
	fields := testutil.Decode[api.Error](t, rec).Error.Fields
	if fields == nil {
		t.Fatal("no field errors")
	}
	return *fields
}

func ptr[T any](v T) *T { return &v }

var chilli = map[string]any{
	"name": "  Chilli con carne ", "description": "Smoky and rich.", "servings": 4, "cuisine": "Mexican",
	"allergens": []string{"celery"}, "dietaryTags": []string{"gluten_free", "dairy_free"},
	"macros":    map[string]any{"calories": 520, "proteinG": 32.5, "saltG": 1.2},
	"micros":    []map[string]any{{"nutrient": "iron", "amount": 4.25}, {"nutrient": "vitamin_c", "amount": 30}},
	"costPence": 180,
	"ingredients": []map[string]any{
		{"quantity": 500, "unit": "g", "name": "Beef mince", "category": "meat"},
		{"quantity": 2, "name": "Onions", "note": "finely chopped", "category": "produce"},
		{"name": "Salt"},
	},
	"recipe": map[string]any{
		"instructions": "Brown the mince.\nAdd everything else.", "prepMinutes": 15, "cookMinutes": 90,
		"sourceUrl": "https://example.com/chilli",
	},
}

func TestCreateAndReadMeal(t *testing.T) {
	t.Parallel()
	d := parent(t, newServer(t), email)
	created := create(t, d, chilli)
	got := testutil.Decode[api.Meal](t, d.Call(http.MethodGet, "/meals/"+created.Id, nil, http.StatusOK))

	want := api.Meal{
		Id: created.Id, Name: "Chilli con carne", Description: "Smoky and rich.", Servings: ptr(4), Cuisine: ptr("Mexican"),
		Allergens: []api.Allergen{"celery"}, DietaryTags: []api.DietaryTag{"gluten_free", "dairy_free"},
		Macros:    api.Macros{Calories: ptr(520), ProteinG: ptr(32.5), SaltG: ptr(1.2)},
		Micros:    []api.Micro{{Nutrient: "iron", Amount: 4.25}, {Nutrient: "vitamin_c", Amount: 30}},
		CostPence: ptr(180),
		Ingredients: []api.Ingredient{
			{Quantity: ptr(500.0), Unit: ptr(api.Unit("g")), Name: "Beef mince", Category: ptr(api.IngredientCategory("meat"))},
			{Quantity: ptr(2.0), Name: "Onions", Note: "finely chopped", Category: ptr(api.IngredientCategory("produce"))},
			{Name: "Salt"},
		},
		Recipe: &api.Recipe{
			Instructions: "Brown the mince.\nAdd everything else.", PrepMinutes: ptr(15), CookMinutes: ptr(90),
			SourceUrl: ptr("https://example.com/chilli"),
		},
		CreatedAt: got.CreatedAt, UpdatedAt: got.UpdatedAt,
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("read back:\n got %+v\nwant %+v", got, want)
	}
	if !reflect.DeepEqual(created, got) {
		t.Errorf("create response differs from read:\n got %+v\nwant %+v", created, got)
	}
}

func TestMealWithOnlyAName(t *testing.T) {
	t.Parallel()
	d := parent(t, newServer(t), email)
	m := create(t, d, map[string]any{"name": "Cereal"})
	want := api.Meal{
		Id: m.Id, Name: "Cereal", Allergens: []api.Allergen{}, DietaryTags: []api.DietaryTag{},
		Micros: []api.Micro{}, Ingredients: []api.Ingredient{}, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	if !reflect.DeepEqual(m, want) {
		t.Errorf("got %+v\nwant %+v", m, want)
	}
}

func TestInvalidMealIsRefused(t *testing.T) {
	t.Parallel()
	d := parent(t, newServer(t), email)
	fields := fieldErrors(t, d, http.MethodPost, "/meals", map[string]any{
		"name": "   ",
		"ingredients": []map[string]any{
			{"quantity": 1, "name": "Egg"},
			{"unit": "g", "name": "Flour"},
		},
		"micros": []map[string]any{{"nutrient": "iron", "amount": 1}, {"nutrient": "iron", "amount": 2}},
	})
	for _, f := range []string{"name", "ingredients.1.unit", "micros.1.nutrient"} {
		if fields[f] == "" {
			t.Errorf("no error for %s: %v", f, fields)
		}
	}
	if len(fields) != 3 {
		t.Errorf("unexpected fields: %v", fields)
	}
	if names := list(t, d, ""); len(names) != 0 {
		t.Errorf("meals stored: %v", names)
	}
}

func TestListIsSortedAndSearchable(t *testing.T) {
	t.Parallel()
	d := parent(t, newServer(t), email)
	for _, name := range []string{"banana bread", "Apple pie", "Chicken pie", "apricot crumble"} {
		create(t, d, map[string]any{"name": name})
	}
	if got, want := list(t, d, ""), []string{"Apple pie", "apricot crumble", "banana bread", "Chicken pie"}; !slices.Equal(got, want) {
		t.Errorf("sorted: %v", got)
	}
	if got, want := list(t, d, "?q=PIE"), []string{"Apple pie", "Chicken pie"}; !slices.Equal(got, want) {
		t.Errorf("search: %v", got)
	}
}

func TestUpdateReplacesEverything(t *testing.T) {
	t.Parallel()
	d := parent(t, newServer(t), email)
	m := create(t, d, chilli)
	got := testutil.Decode[api.Meal](t, d.Call(http.MethodPut, "/meals/"+m.Id, map[string]any{
		"name":        "Veggie chilli",
		"ingredients": []map[string]any{{"quantity": 400, "unit": "g", "name": "Kidney beans", "category": "tins"}},
		"micros":      []map[string]any{{"nutrient": "zinc", "amount": 2}},
	}, http.StatusOK))
	want := api.Meal{
		Id: m.Id, Name: "Veggie chilli", Allergens: []api.Allergen{}, DietaryTags: []api.DietaryTag{},
		Micros:      []api.Micro{{Nutrient: "zinc", Amount: 2}},
		Ingredients: []api.Ingredient{{Quantity: ptr(400.0), Unit: ptr(api.Unit("g")), Name: "Kidney beans", Category: ptr(api.IngredientCategory("tins"))}},
		CreatedAt:   m.CreatedAt, UpdatedAt: got.UpdatedAt,
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %+v\nwant %+v", got, want)
	}
	if read := testutil.Decode[api.Meal](t, d.Call(http.MethodGet, "/meals/"+m.Id, nil, http.StatusOK)); !reflect.DeepEqual(read, got) {
		t.Errorf("read after update: %+v", read)
	}
}

func TestDeletedMealIsGone(t *testing.T) {
	t.Parallel()
	d := parent(t, newServer(t), email)
	m := create(t, d, chilli)
	d.Call(http.MethodDelete, "/meals/"+m.Id, nil, http.StatusNoContent)
	d.Expect(d.Do(http.MethodGet, "/meals/"+m.Id, nil), http.StatusNotFound, "not_found")
	d.Expect(d.Do(http.MethodDelete, "/meals/"+m.Id, nil), http.StatusNotFound, "not_found")
	if names := list(t, d, ""); len(names) != 0 {
		t.Errorf("still listed: %v", names)
	}
}

func TestAnotherFamilysMealIsNotFound(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	a := parent(t, srv, email)
	m := create(t, a, chilli)
	b := parent(t, srv, "other@example.com")
	b.Expect(b.Do(http.MethodGet, "/meals/"+m.Id, nil), http.StatusNotFound, "not_found")
	b.Expect(b.Do(http.MethodPut, "/meals/"+m.Id, map[string]any{"name": "Mine now"}), http.StatusNotFound, "not_found")
	b.Expect(b.Do(http.MethodDelete, "/meals/"+m.Id, nil), http.StatusNotFound, "not_found")
	if got := testutil.Decode[api.Meal](t, a.Call(http.MethodGet, "/meals/"+m.Id, nil, http.StatusOK)); got.Name != "Chilli con carne" {
		t.Errorf("changed by another family: %+v", got)
	}
}

func TestChildReadsButCannotChangeMeals(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	owner := parent(t, srv, email)
	m := create(t, owner, chilli)
	kid := srv.Device(t)
	kid.Join(email, owner.CreateProfile("Kid", "CHILD", "").Id, "")

	if names := list(t, kid, ""); !slices.Equal(names, []string{"Chilli con carne"}) {
		t.Errorf("child list: %v", names)
	}
	kid.Call(http.MethodGet, "/meals/"+m.Id, nil, http.StatusOK)
	kid.Call(http.MethodGet, "/ingredient-names?q=on", nil, http.StatusOK)
	kid.Expect(kid.Do(http.MethodPost, "/meals", map[string]any{"name": "Sweets"}), http.StatusForbidden, "forbidden")
	kid.Expect(kid.Do(http.MethodPut, "/meals/"+m.Id, map[string]any{"name": "Sweets"}), http.StatusForbidden, "forbidden")
	kid.Expect(kid.Do(http.MethodDelete, "/meals/"+m.Id, nil), http.StatusForbidden, "forbidden")
}

func TestMealRoutesNeedTheModule(t *testing.T) {
	t.Parallel()
	d := parent(t, newServer(t), email)
	m := create(t, d, map[string]any{"name": "Toast"})
	d.Call(http.MethodPut, "/modules/meals", map[string]any{"enabled": false}, http.StatusOK)
	for _, c := range []struct {
		method, path string
		body         any
	}{
		{http.MethodGet, "/meals", nil},
		{http.MethodPost, "/meals", map[string]any{"name": "Toast"}},
		{http.MethodGet, "/meals/" + m.Id, nil},
		{http.MethodPut, "/meals/" + m.Id, map[string]any{"name": "Toast"}},
		{http.MethodDelete, "/meals/" + m.Id, nil},
		{http.MethodGet, "/ingredient-names?q=a", nil},
	} {
		d.Expect(d.Do(c.method, c.path, c.body), http.StatusForbidden, "module_disabled")
	}
}

func TestIngredientNames(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	a := parent(t, srv, email)
	ingredients := []map[string]any{{"name": "Red onion"}, {"name": "Spring  Onion"}, {"name": "Garlic"}}
	for i := range 12 {
		ingredients = append(ingredients, map[string]any{"name": "Onion " + strconv.Itoa(i+10)})
	}
	create(t, a, map[string]any{"name": "Soup", "ingredients": ingredients})
	create(t, a, map[string]any{"name": "Salad", "ingredients": []map[string]any{{"name": "red onion"}}})
	b := parent(t, srv, "other@example.com")
	create(t, b, map[string]any{"name": "Bhaji", "ingredients": []map[string]any{{"name": "Onion bhaji mix"}, {"name": "Onion 1"}}})

	names := testutil.Decode[api.IngredientNameList](t, a.Call(http.MethodGet, "/ingredient-names?q=ONION", nil, http.StatusOK)).Names
	want := []string{
		"Onion 10", "Onion 11", "Onion 12", "Onion 13", "Onion 14", "Onion 15", "Onion 16", "Onion 17", "Onion 18", "Onion 19",
	}
	if !slices.Equal(names, want) {
		t.Errorf("first ten: %v", names)
	}
	names = testutil.Decode[api.IngredientNameList](t, a.Call(http.MethodGet, "/ingredient-names?q=d+on", nil, http.StatusOK)).Names
	if !slices.Equal(names, []string{"red onion"}) {
		t.Errorf("one spelling per name: %v", names)
	}
	names = testutil.Decode[api.IngredientNameList](t, a.Call(http.MethodGet, "/ingredient-names?q=g+onion", nil, http.StatusOK)).Names
	if !slices.Equal(names, []string{"Spring  Onion"}) {
		t.Errorf("as typed: %v", names)
	}
	if fields := fieldErrors(t, a, http.MethodGet, "/ingredient-names?q=+", nil); fields["q"] == "" {
		t.Errorf("blank q: %v", fields)
	}
}
