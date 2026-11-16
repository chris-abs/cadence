-- domain: meals/meal (every table below; only db/queries/meals/meal may query them)

-- +goose Up
CREATE TABLE meal (
    id              uuid PRIMARY KEY,
    family_id       uuid NOT NULL REFERENCES family (id) ON DELETE CASCADE,
    name            text NOT NULL CONSTRAINT meal_name_length CHECK (char_length(name) BETWEEN 1 AND 120),
    description     text NOT NULL DEFAULT '' CONSTRAINT meal_description_length CHECK (char_length(description) <= 2000),
    servings        smallint NULL CONSTRAINT meal_servings_range CHECK (servings BETWEEN 1 AND 50),
    cuisine         text NULL CONSTRAINT meal_cuisine_length CHECK (char_length(cuisine) <= 50),
    allergens       text[] NOT NULL DEFAULT '{}' CONSTRAINT meal_allergens_valid CHECK (allergens <@ ARRAY[
        'celery', 'cereals_gluten', 'crustaceans', 'eggs', 'fish', 'lupin', 'milk', 'molluscs',
        'mustard', 'peanuts', 'sesame', 'soya', 'sulphites', 'tree_nuts'
    ]::text[]),
    dietary_tags    text[] NOT NULL DEFAULT '{}' CONSTRAINT meal_dietary_tags_valid CHECK (dietary_tags <@ ARRAY[
        'vegetarian', 'vegan', 'pescatarian', 'gluten_free', 'dairy_free', 'nut_free', 'halal', 'kosher'
    ]::text[]),
    calories        integer NULL CONSTRAINT meal_calories_positive CHECK (calories >= 0),
    protein_g       numeric(6, 1) NULL CONSTRAINT meal_protein_positive CHECK (protein_g >= 0),
    carbs_g         numeric(6, 1) NULL CONSTRAINT meal_carbs_positive CHECK (carbs_g >= 0),
    sugar_g         numeric(6, 1) NULL CONSTRAINT meal_sugar_positive CHECK (sugar_g >= 0),
    fat_g           numeric(6, 1) NULL CONSTRAINT meal_fat_positive CHECK (fat_g >= 0),
    saturated_fat_g numeric(6, 1) NULL CONSTRAINT meal_saturated_fat_positive CHECK (saturated_fat_g >= 0),
    fibre_g         numeric(6, 1) NULL CONSTRAINT meal_fibre_positive CHECK (fibre_g >= 0),
    salt_g          numeric(6, 1) NULL CONSTRAINT meal_salt_positive CHECK (salt_g >= 0),
    cost_pence      integer NULL CONSTRAINT meal_cost_positive CHECK (cost_pence >= 0),
    created_by      uuid NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT meal_family_id_key UNIQUE (family_id, id),
    CONSTRAINT meal_created_by_fkey FOREIGN KEY (family_id, created_by)
        REFERENCES profile (family_id, id) ON DELETE SET NULL (created_by)
);
CREATE INDEX meal_family_name_idx ON meal (family_id, lower(name));
CREATE INDEX meal_created_by_idx ON meal (created_by);
CREATE TRIGGER meal_set_updated_at BEFORE UPDATE ON meal
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE meal ENABLE ROW LEVEL SECURITY;

CREATE TABLE meal_ingredient (
    id         uuid PRIMARY KEY,
    family_id  uuid NOT NULL REFERENCES family (id) ON DELETE CASCADE,
    meal_id    uuid NOT NULL,
    position   smallint NOT NULL CONSTRAINT meal_ingredient_position_positive CHECK (position >= 0),
    quantity   numeric(10, 3) NULL CONSTRAINT meal_ingredient_quantity_positive CHECK (quantity > 0),
    unit       text NULL CONSTRAINT meal_ingredient_unit_valid CHECK (unit IN (
        'g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'clove', 'slice', 'tin', 'pack', 'bunch', 'pinch'
    )),
    name       text NOT NULL CONSTRAINT meal_ingredient_name_length CHECK (char_length(name) BETWEEN 1 AND 80),
    name_key   text NOT NULL GENERATED ALWAYS AS (lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))) STORED,
    note       text NOT NULL DEFAULT '' CONSTRAINT meal_ingredient_note_length CHECK (char_length(note) <= 200),
    category   text NULL CONSTRAINT meal_ingredient_category_valid CHECK (category IN (
        'produce', 'meat', 'fish', 'dairy', 'bakery', 'tins', 'dry_goods', 'frozen', 'drinks', 'household', 'other'
    )),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT meal_ingredient_unit_needs_quantity CHECK (unit IS NULL OR quantity IS NOT NULL),
    CONSTRAINT meal_ingredient_position_key UNIQUE (meal_id, position),
    CONSTRAINT meal_ingredient_meal_fkey FOREIGN KEY (family_id, meal_id)
        REFERENCES meal (family_id, id) ON DELETE CASCADE
);
CREATE INDEX meal_ingredient_family_name_key_idx ON meal_ingredient (family_id, name_key);
CREATE TRIGGER meal_ingredient_set_updated_at BEFORE UPDATE ON meal_ingredient
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE meal_ingredient ENABLE ROW LEVEL SECURITY;

CREATE TABLE meal_nutrient (
    id         uuid PRIMARY KEY,
    family_id  uuid NOT NULL REFERENCES family (id) ON DELETE CASCADE,
    meal_id    uuid NOT NULL,
    nutrient   text NOT NULL CONSTRAINT meal_nutrient_nutrient_valid CHECK (nutrient IN (
        'vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'vitamin_b6', 'vitamin_b12',
        'folate', 'calcium', 'iron', 'magnesium', 'potassium', 'zinc'
    )),
    amount     numeric(8, 2) NOT NULL CONSTRAINT meal_nutrient_amount_positive CHECK (amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT meal_nutrient_meal_nutrient_key UNIQUE (meal_id, nutrient),
    CONSTRAINT meal_nutrient_meal_fkey FOREIGN KEY (family_id, meal_id)
        REFERENCES meal (family_id, id) ON DELETE CASCADE
);
CREATE TRIGGER meal_nutrient_set_updated_at BEFORE UPDATE ON meal_nutrient
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE meal_nutrient ENABLE ROW LEVEL SECURITY;

CREATE TABLE recipe (
    id           uuid PRIMARY KEY,
    family_id    uuid NOT NULL REFERENCES family (id) ON DELETE CASCADE,
    meal_id      uuid NOT NULL,
    instructions text NOT NULL DEFAULT '' CONSTRAINT recipe_instructions_length CHECK (char_length(instructions) <= 20000),
    prep_minutes smallint NULL CONSTRAINT recipe_prep_minutes_range CHECK (prep_minutes BETWEEN 0 AND 1440),
    cook_minutes smallint NULL CONSTRAINT recipe_cook_minutes_range CHECK (cook_minutes BETWEEN 0 AND 1440),
    source_url   text NULL CONSTRAINT recipe_source_url_valid
        CHECK (char_length(source_url) <= 2048 AND source_url ~* '^https?://'),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT recipe_meal_id_key UNIQUE (meal_id),
    CONSTRAINT recipe_meal_fkey FOREIGN KEY (family_id, meal_id)
        REFERENCES meal (family_id, id) ON DELETE CASCADE
);
CREATE TRIGGER recipe_set_updated_at BEFORE UPDATE ON recipe
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE recipe ENABLE ROW LEVEL SECURITY;

-- +goose Down
DROP TABLE recipe;
DROP TABLE meal_nutrient;
DROP TABLE meal_ingredient;
DROP TABLE meal;
