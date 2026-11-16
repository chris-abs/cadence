-- name: ListMeals :many
SELECT m.id, m.name, m.servings, m.cuisine, m.allergens, m.dietary_tags, m.calories, m.cost_pence,
       (r.id IS NOT NULL)::boolean AS has_recipe, r.prep_minutes, r.cook_minutes
FROM meal m
LEFT JOIN recipe r ON r.family_id = m.family_id AND r.meal_id = m.id
WHERE m.family_id = @family_id AND strpos(lower(m.name), lower(@q::text)) > 0
ORDER BY lower(m.name), m.id;

-- name: GetMeal :one
SELECT sqlc.embed(m), r.id AS recipe_id, r.instructions, r.prep_minutes, r.cook_minutes, r.source_url
FROM meal m
LEFT JOIN recipe r ON r.family_id = m.family_id AND r.meal_id = m.id
WHERE m.family_id = @family_id AND m.id = @id;

-- name: ListIngredients :many
SELECT * FROM meal_ingredient
WHERE family_id = @family_id AND meal_id = @meal_id
ORDER BY position;

-- name: ListNutrients :many
SELECT * FROM meal_nutrient
WHERE family_id = @family_id AND meal_id = @meal_id
ORDER BY nutrient;

-- name: CreateMeal :exec
INSERT INTO meal (
    id, family_id, name, description, servings, cuisine, allergens, dietary_tags, calories,
    protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fibre_g, salt_g, cost_pence, created_by
) VALUES (
    @id, @family_id, @name, @description, sqlc.narg(servings), sqlc.narg(cuisine), @allergens, @dietary_tags,
    sqlc.narg(calories), sqlc.narg(protein_g), sqlc.narg(carbs_g), sqlc.narg(sugar_g), sqlc.narg(fat_g),
    sqlc.narg(saturated_fat_g), sqlc.narg(fibre_g), sqlc.narg(salt_g), sqlc.narg(cost_pence), @created_by
);

-- name: UpdateMeal :execrows
UPDATE meal SET
    name = @name, description = @description, servings = sqlc.narg(servings), cuisine = sqlc.narg(cuisine),
    allergens = @allergens, dietary_tags = @dietary_tags, calories = sqlc.narg(calories),
    protein_g = sqlc.narg(protein_g), carbs_g = sqlc.narg(carbs_g), sugar_g = sqlc.narg(sugar_g),
    fat_g = sqlc.narg(fat_g), saturated_fat_g = sqlc.narg(saturated_fat_g), fibre_g = sqlc.narg(fibre_g),
    salt_g = sqlc.narg(salt_g), cost_pence = sqlc.narg(cost_pence)
WHERE family_id = @family_id AND id = @id;

-- name: ClearMealContents :exec
WITH ingredients AS (
    DELETE FROM meal_ingredient WHERE meal_ingredient.family_id = @family_id AND meal_ingredient.meal_id = @meal_id
), nutrients AS (
    DELETE FROM meal_nutrient WHERE meal_nutrient.family_id = @family_id AND meal_nutrient.meal_id = @meal_id
)
DELETE FROM recipe WHERE recipe.family_id = @family_id AND recipe.meal_id = @meal_id;

-- name: CreateIngredients :copyfrom
INSERT INTO meal_ingredient (id, family_id, meal_id, position, quantity, unit, name, note, category)
VALUES (@id, @family_id, @meal_id, @position, @quantity, @unit, @name, @note, @category);

-- name: CreateNutrients :copyfrom
INSERT INTO meal_nutrient (id, family_id, meal_id, nutrient, amount)
VALUES (@id, @family_id, @meal_id, @nutrient, @amount);

-- name: CreateRecipe :exec
INSERT INTO recipe (id, family_id, meal_id, instructions, prep_minutes, cook_minutes, source_url)
VALUES (@id, @family_id, @meal_id, @instructions, sqlc.narg(prep_minutes), sqlc.narg(cook_minutes), sqlc.narg(source_url));

-- name: DeleteMeal :execrows
DELETE FROM meal WHERE family_id = @family_id AND id = @id;

-- name: ListIngredientNames :many
SELECT name FROM (
    SELECT DISTINCT ON (name_key) name_key, name
    FROM meal_ingredient
    WHERE family_id = @family_id
      AND strpos(name_key, lower(btrim(regexp_replace(@q::text, '\s+', ' ', 'g')))) > 0
    ORDER BY name_key, updated_at DESC
) AS used
ORDER BY name_key
LIMIT 10;
