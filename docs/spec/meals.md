# Meal planning — server spec and data model

**Status: revised 2026-11-16, awaiting owner approval.** Decisions behind it are in
`docs/decisions/0004-meals-decisions.md`. This spec covers behaviour, data and endpoints.
Screens and client behaviour are the owner's and are not specified here.

The flow is **meals → weekly plan → shopping list**.

- A **meal** is something a family eats: its ingredients, nutrition, cost and dietary
  information. A meal carries its own numbers; nothing is calculated from ingredients.
- A **recipe** is how to cook a meal: instructions and timings. A meal has one recipe or
  none (cereal, a sandwich, a ready meal).
- A family's meals start as a copy of the Cadence **recipe book**.
- Parents put meals or free text on the days of a week. From a week's plan a parent
  generates one shopping list that merges duplicate ingredients; anyone ticks items off.

Lines marked **(addition)** did not come from the owner; the reason is given each time.

## 1. Recipe book

The recipe book is Cadence's own catalogue of meals, most with a recipe, the same for
every family.

| Rule | Behaviour |
|---|---|
| B1. Sign-up seeds the family | Registering a family copies every book meal, with its recipe, into that family's meals, in the same transaction as the registration. |
| B2. Copies are ordinary meals | A family edits or deletes its copies freely. Nothing a family does changes the book or another family. |
| B3. Nothing updates on its own | When the book gains a meal or a book meal is changed, no family's meals change. |
| B4. The book can be browsed | A family sees every book meal with where it stands (below). |
| B5. Adopt | Adopting a book meal gives the family the book's current version. If the family has no copy, one is added. If it has a copy, edited or not, its content is overwritten and the family's edits are lost. The meal keeps its id, so plan entries stay linked. |
| B6. Book off | Copies the family has not edited leave the family's meal list and search. Copies the family has edited, and its own meals, stay. Nothing is deleted: plan entries keep pointing at the same meal by id and still show it. |
| B7. Book back on | The same meals return to the list, unchanged. Any the book has changed since show as `update_available`, like any other copy. |

Where a family stands on a book meal:

| Status | Meaning |
|---|---|
| `not_added` | The family has no copy: the meal is newer than their sign-up, or they deleted it |
| `current` | Their copy is unedited and matches the book |
| `update_available` | Their copy is unedited and the book has changed since |
| `edited` | They have edited their copy |

- **(addition)** Each family meal records which book meal it came from, the book revision it
  was copied at, and whether it has been edited. Without this B4, B5 and B6 cannot work.
- **(addition)** Any save of a copied meal marks it edited, even if nothing changed.
  Comparing every field to decide would be more code for no real gain.
- **(addition)** Adopting while the book is off is refused (409).
- **(addition)** The book's content arrives by migration when the owner is ready. Until
  then the book is empty and every rule above still holds. A migration that changes a book
  meal or its recipe raises the meal's revision.

## 2. Meals and recipes

| Rule | Behaviour |
|---|---|
| M1. Add a meal | Name required (1–120 characters, trimmed). Everything else is optional: description, servings, cuisine, allergens, dietary tags, macros, micros, cost, ingredients (0–100, kept in order) and a recipe. |
| M2. Numbers are per serving | Macros, micros and cost describe one serving and are typed in. Any of them may be left blank. Changing a meal's ingredients does not change its numbers. |
| M3. Ingredients | Each has an optional quantity (decimal > 0), an optional unit, a required name, an optional note ("finely chopped") and an optional category (the shop aisle). A unit without a quantity is refused (422). |
| M4. Recipe | Optional. Instructions as plain text, one step per line; prep and cook minutes; a source link. Saved with its meal. |
| M5. Ingredient names | A lookup returns up to 10 of the family's existing ingredient names matching some text, so the same ingredient is typed the same way. |
| M6. Find a meal | List sorted by name, with a case-insensitive search on the name. Another family's meal id returns 404, never 403. |
| M7. Edit a meal | A save replaces every field, the ingredients, the micros and the recipe in one transaction. Leaving the recipe out removes it. Shopping lists do not change until regenerated, and report themselves stale. |
| M8. Delete a meal | Permanent, with its recipe. Plan entries that used it stay as free text with its last name. |

Each meal reports the book meal it came from, if any, and whether it has been edited.

Fixed lists **(additions: the owner asked for the fields; these values are a first proposal)**:

| List | Values |
|---|---|
| Macros | calories (kcal); protein, carbohydrate, sugar, fat, saturated fat, fibre, salt (g) |
| Micros | vitamin A, D, K, B12, folate (µg); vitamin C, E, B6, calcium, iron, magnesium, potassium, zinc (mg) |
| Allergens | celery, cereals with gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, peanuts, sesame, soya, sulphites, tree nuts |
| Dietary tags | vegetarian, vegan, pescatarian, gluten free, dairy free, nut free, halal, kosher |
| Ingredient categories | produce, meat, fish, dairy, bakery, tins, dry goods, frozen, drinks, household, other |

Cuisine is free text. Cost is whole pence, one currency.

## 3. Weekly plan

| Rule | Behaviour |
|---|---|
| P1. Read a range | Entries between two dates (at most 42 days). Each has its date, slot, position, title, servings and note, and for a meal entry the meal's name, servings, calories and cost, so a week's totals can be shown. |
| P2. Meal entry | Stores the meal and a copy of its name as the title. Optional servings and note. |
| P3. Free-text entry | "Leftovers", "Eating out": a title and no meal. An empty title is refused (422). |
| P4. Change the plan | Move an entry to another date, slot or position; swap its meal or text; delete it. Several entries per slot are allowed, ordered by position. |

Slots are breakfast, lunch, dinner and snack; dinner is the default. Weeks start on Monday.

## 4. Shopping list

| Rule | Behaviour |
|---|---|
| S1. Make the week's list | Generating a week's list creates it, or regenerates it. Lines come only from meal entries in that week; free-text entries add nothing. |
| S2. Duplicates merge | The same normalised name with a compatible unit becomes one line (`200 g` + `0.5 kg` onion → `700 g`). Incompatible units stay separate (`2` onions and `300 g` onion). Lines with no quantity merge into one line with no quantity. Each line lists the meals it came from and carries the ingredient's category. |
| S3. Servings scale | A line's quantity is multiplied by the entry's servings ÷ the meal's servings when both are set, otherwise by 1. |
| S4. Regenerating keeps work | Manual items are untouched. A generated line that is still needed keeps its tick unless its quantity went up. Lines no longer needed are removed; new ones are added. |
| S5. The list knows it is stale | Reading a list reports `stale: true` when regenerating now would produce different lines. |
| S6. Manual items | "Kitchen roll", with optional quantity, unit and category. Manual items can be edited and deleted. Generated lines can only be ticked. |
| S7. Ticking | Setting checked to true or false is a set, not a toggle, so two phones never fight. The list records who ticked and when. |

There is one list per family per week, identified by the Monday it starts on. Any other
weekday is refused (422).

## 5. Roles

Authorisation detail is deferred by the owner. Until it is revisited, the permissions
already in the module catalogue apply: only parents change things, everyone views and ticks.

| Action | Permission | PARENT | CHILD |
|---|---|---|---|
| View meals, book, plan, lists | `meals.view` | ✓ | ✓ |
| Create, edit, delete, adopt a meal | `meals.recipes.edit` | ✓ | 403 |
| Turn the book on or off | `meals.settings.edit` | ✓ | 403 |
| Create, edit, move, delete a plan entry | `meals.plan.edit` | ✓ | 403 |
| Generate or regenerate a list | `meals.shopping.generate` | ✓ | 403 |
| Add, edit, delete a manual item | `meals.shopping.items.edit` | ✓ | 403 |
| Tick or untick an item | `meals.shopping.tick` | ✓ | ✓ |

Every route needs a profile session (401 without one) and the meals module enabled.

## 6. Data model

Conventions for every table: `id uuid PRIMARY KEY` (UUIDv7, set in Go), `created_at` and
`updated_at timestamptz NOT NULL DEFAULT now()` with the `set_updated_at()` trigger, row
level security enabled with no policies. No soft delete.

Every table except the book tables carries `family_id uuid NOT NULL REFERENCES family(id)
ON DELETE CASCADE`, so deleting a family removes all of its meals data.

**Family scoping:** where a row points at another family-owned row (`meal_id`, `list_id`),
a composite foreign key `(family_id, x_id) → parent(family_id, id)` makes a link across
families impossible in the database, not only in Go. Those parents carry `UNIQUE (family_id, id)`.

### 6.1 Meals

**`meal`** — a family's meal.

| Column | Type | Constraints |
|---|---|---|
| `name` | `text NOT NULL` | 1–120 characters |
| `description` | `text NOT NULL DEFAULT ''` | ≤ 2,000 |
| `servings` | `smallint NULL` | 1–50; what the numbers and ingredient amounts are based on |
| `cuisine` | `text NULL` | ≤ 50 |
| `allergens` | `text[] NOT NULL DEFAULT '{}'` | Values from the fixed list |
| `dietary_tags` | `text[] NOT NULL DEFAULT '{}'` | Values from the fixed list |
| `calories` | `integer NULL` | kcal per serving, ≥ 0 |
| `protein_g`, `carbs_g`, `sugar_g`, `fat_g`, `saturated_fat_g`, `fibre_g`, `salt_g` | `numeric(6,1) NULL` | Per serving, ≥ 0 |
| `cost_pence` | `integer NULL` | Per serving, ≥ 0 |
| `book_meal_id` | `uuid NULL` | References `book_meal(id) ON DELETE SET NULL`; NULL = the family's own |
| `book_revision` | `integer NULL` | The book revision this copy was taken at |
| `edited` | `boolean NOT NULL DEFAULT false` | Set on any save of a copied meal; cleared by adopt |
| `created_by` | `uuid NULL` | References `profile(id) ON DELETE SET NULL`; NULL for seeded copies |

Indexes: `UNIQUE (family_id, id)`; `UNIQUE (family_id, book_meal_id)` (one copy of a book
meal per family); `(family_id, lower(name))` for the sorted list and search.
Names are not unique: two "Chilli" meals are allowed.

**`meal_ingredient`** — one row per ingredient; replaced wholesale when a meal is saved.

| Column | Type | Constraints |
|---|---|---|
| `meal_id` | `uuid NOT NULL` | `FOREIGN KEY (family_id, meal_id) REFERENCES meal(family_id, id) ON DELETE CASCADE` |
| `position` | `smallint NOT NULL` | `UNIQUE (meal_id, position)`, 0-based |
| `quantity` | `numeric(10,3) NULL` | `CHECK (quantity > 0)` |
| `unit` | `text NULL` | One of the codes in §6.5; NULL = a count ("2 onions") |
| `name` | `text NOT NULL` | 1–80 characters, as typed |
| `name_key` | generated: lower case, trimmed, inner whitespace collapsed | The merge key |
| `note` | `text NOT NULL DEFAULT ''` | Preparation, not part of the key ("diced") |
| `category` | `text NULL` | Value from the fixed list |
| | | `CHECK (unit IS NULL OR quantity IS NOT NULL)` |

Indexes: the unique `(meal_id, position)`; `(family_id, name_key)` for the name lookup.
An ingredient is only words and an amount. A shared ingredient catalogue that calculates
nutrition and cost can attach to `name_key` later without changing this table.

**`meal_nutrient`** — a meal's micros, one row each; replaced wholesale when a meal is saved.

| Column | Type | Constraints |
|---|---|---|
| `meal_id` | `uuid NOT NULL` | Composite foreign key as above, `ON DELETE CASCADE` |
| `nutrient` | `text NOT NULL` | Value from the fixed list; `UNIQUE (meal_id, nutrient)` |
| `amount` | `numeric(8,2) NOT NULL` | Per serving, ≥ 0; the unit is fixed by the nutrient |

**`recipe`** — how to cook a meal. At most one per meal.

| Column | Type | Constraints |
|---|---|---|
| `meal_id` | `uuid NOT NULL` | Composite foreign key as above, `ON DELETE CASCADE`; `UNIQUE (meal_id)` |
| `instructions` | `text NOT NULL DEFAULT ''` | Plain text, one step per line; ≤ 20,000 |
| `prep_minutes`, `cook_minutes` | `smallint NULL` | 0–1440 |
| `source_url` | `text NULL` | http(s), ≤ 2,048 |

**`recipe_book_setting`** — whether a family has the book on. No row means on.

| Column | Type | Constraints |
|---|---|---|
| `family_id` | `uuid PRIMARY KEY` | References `family(id) ON DELETE CASCADE`; no separate `id` |
| `enabled` | `boolean NOT NULL` | |

A meal is listed when it is the family's own, or edited, or the book is on. That one
condition lives in the meal list query; reading a meal by id is never affected.

### 6.2 Recipe book

`book_meal`, `book_meal_ingredient`, `book_meal_nutrient` and `book_recipe` mirror the four
tables above without `family_id`, `created_by` or the three book-link columns. `book_meal`
adds:

| Column | Type | Constraints |
|---|---|---|
| `revision` | `integer NOT NULL DEFAULT 1` | Raised by any migration that changes the meal or its recipe |

If a book meal is ever withdrawn, families' copies stay and become their own meals.

### 6.3 Weekly plan

**`meal_plan_entry`** — one thing to eat in one slot on one date. There is no "week" row.

| Column | Type | Constraints |
|---|---|---|
| `date` | `date NOT NULL` | A calendar date, no timezone |
| `slot` | `text NOT NULL DEFAULT 'dinner'` | `breakfast`, `lunch`, `dinner` or `snack` |
| `position` | `smallint NOT NULL DEFAULT 0` | Order within a slot; not unique |
| `meal_id` | `uuid NULL` | `FOREIGN KEY (family_id, meal_id) REFERENCES meal(family_id, id) ON DELETE SET NULL (meal_id)` |
| `title` | `text NOT NULL` | 1–120 characters; free text, or a copy of the meal's name |
| `servings` | `smallint NULL` | 1–50 |
| `note` | `text NOT NULL DEFAULT ''` | ≤ 500 |
| `created_by` | `uuid NULL` | References `profile(id) ON DELETE SET NULL` |

Indexes: `(family_id, date)`; `(meal_id)`.

"Meal or free text" is one column being NULL. The title is always present, so a meal the
family deletes leaves a free-text entry with no special case. Responses show the meal's
live name while it exists.

### 6.4 Shopping list

**`shopping_list`** — one per family per week.

| Column | Type | Constraints |
|---|---|---|
| `week_start` | `date NOT NULL` | A Monday; `UNIQUE (family_id, week_start)`; covers seven days |
| `generated_at` | `timestamptz NULL` | NULL = only manual items so far |
| `source_hash` | `text NULL` | Hash of the generated lines at the last generation, for S5 |

Also `UNIQUE (family_id, id)`.

**`shopping_item`**

| Column | Type | Constraints |
|---|---|---|
| `list_id` | `uuid NOT NULL` | `FOREIGN KEY (family_id, list_id) REFERENCES shopping_list(family_id, id) ON DELETE CASCADE` |
| `origin` | `text NOT NULL` | `generated` or `manual` |
| `name` | `text NOT NULL` | 1–80 characters |
| `name_key` | generated, as on `meal_ingredient` | |
| `quantity` | `numeric(12,3) NULL` | `CHECK (quantity > 0)` |
| `unit` | `text NULL` | Same codes |
| `category` | `text NULL` | Value from the fixed list |
| `sources` | `text[] NOT NULL DEFAULT '{}'` | Generated only: the meals it came from, by name |
| `checked_at` | `timestamptz NULL` | Ticked when set |
| `checked_by` | `uuid NULL` | References `profile(id) ON DELETE SET NULL` |

Indexes: `(list_id)`; `UNIQUE (list_id, name_key, coalesce(unit, '')) WHERE origin = 'generated'`.

Generated lines are copies, not live views of meals. Ticks stay stable while meals change,
and the list is exactly what the shopper saw.

### 6.5 Units and merging

Units are a fixed list, in the contract and in a database check.

| Group | Codes | Merge rule |
|---|---|---|
| Mass | `g`, `kg`, `oz`, `lb` | Convert to g (1, 1000, 28.35, 453.6) |
| Volume | `ml`, `l`, `tsp`, `tbsp`, `cup` | Convert to ml (1, 1000, 5, 15, 250) |
| Count-like | none, `clove`, `slice`, `tin`, `pack`, `bunch`, `pinch` | Merge only with the identical unit |

Generation is plain Go over rows that SQL only fetches:

1. Collect the ingredients of the week's meal entries, scaled per S3.
2. Group by name key and unit group. If every contribution used the same unit, keep it
   (3 tbsp stays 3 tbsp); otherwise sum in the base unit and show kg or l from 1000.
3. The line's name and category are the most common in the group. Round to 2 decimal places.
4. In one transaction holding a lock on the list: update or insert each line, keep its tick
   unless the quantity went up, delete generated lines no longer produced, store the hash.

Matching is deliberately shallow (case and whitespace). "Tomato" and "tomatoes" do not merge.
Manual items are never merged with generated lines.

## 7. Endpoints

All under `/api`. Ids are uuids, dates are `YYYY-MM-DD`. Another family's id → 404.
Validation failures → 422 with field errors. Two parents saving the same meal: last write wins.

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/meals?q=` | List the family's meals (summary) | view |
| POST | `/meals` | Create a meal, with ingredients, micros and optional recipe | recipes.edit |
| GET | `/meals/{mealId}` | One meal in full, with its recipe if it has one | view |
| PUT | `/meals/{mealId}` | Replace a meal and everything in it | recipes.edit |
| DELETE | `/meals/{mealId}` | Delete (204) | recipes.edit |
| GET | `/ingredient-names?q=` | Up to 10 matching ingredient names | view |
| GET | `/recipe-book` | Whether the book is on, and every book meal with the family's status | view |
| PUT | `/recipe-book` | Turn the book on or off (B6, B7) | settings.edit |
| GET | `/recipe-book/meals/{bookMealId}` | One book meal in full **(addition:** to read our version before adopting over an edited copy) | view |
| POST | `/recipe-book/meals/{bookMealId}/adopt` | Adopt (B5); returns the family's meal | recipes.edit |
| GET | `/meal-plan?from=&to=` | Entries in a range | view |
| POST | `/meal-plan/entries` | Create an entry | plan.edit |
| PATCH | `/meal-plan/entries/{entryId}` | Move or change an entry | plan.edit |
| DELETE | `/meal-plan/entries/{entryId}` | Remove an entry | plan.edit |
| GET | `/shopping-lists/{weekStart}` | List, items and `stale`; 404 if none yet | view |
| POST | `/shopping-lists/{weekStart}/generate` | Create or regenerate | shopping.generate |
| POST | `/shopping-lists/{weekStart}/items` | Add a manual item (creates the list if missing) | shopping.items.edit |
| PATCH | `/shopping-items/{itemId}` | `checked` (shopping.tick); name, quantity, unit, category on manual items (shopping.items.edit) | see left |
| DELETE | `/shopping-items/{itemId}` | Manual items only; a generated line → 422 | shopping.items.edit |

## 8. Server structure

`internal/meals` holds four domains beside `internal/identity`, each one package with a
handler, service, repository and model.

| Package | One sentence | Owns |
|---|---|---|
| `meals/book` | Cadence's catalogue of meals, the same for everyone and read-only | `book_meal`, `book_meal_ingredient`, `book_meal_nutrient`, `book_recipe` |
| `meals/meal` | A family's meals, their recipes and where each stands against the book | `meal`, `meal_ingredient`, `meal_nutrient`, `recipe`, `recipe_book_setting` |
| `meals/plan` | What a family eats on which day | `meal_plan_entry` |
| `meals/shopping` | The week's shopping list and its ticks | `shopping_list`, `shopping_item` |

Dependencies follow the flow and point one way: `shopping` → `plan` → `meal` → `book`. A
package asks the one before it through a small interface it declares itself; none imports
another. Nothing in `identity` imports `meals`: sign-up seeding (B1) is a small interface
declared in `auth` and satisfied by `meal`, wired in `internal/app`.

## 9. Build order

Each is its own pull request, in this order.

| # | Piece | Contains |
|---|---|---|
| 1 | Contract | Every endpoint in §7 added to `api/openapi.yaml` |
| 2 | Meals | Tables in §6.1 except the setting, meal endpoints, ingredient names |
| 3 | Recipe book | Tables in §6.2 and the setting, sign-up seeding, book listing, adopt, on and off |
| 4 | Weekly plan | Table in §6.3, plan endpoints |
| 5 | Shopping list | Tables in §6.4, generation, manual items, ticking |

Each piece carries its own migration and a planned test list, one line per behaviour,
written before the tests.

## 10. Risks and deferred

- **Stated numbers go stale.** Changing a meal's ingredients does not change its macros,
  micros or cost. An ingredient catalogue that calculates them is the later answer.
- **Name matching:** plurals and synonyms produce duplicate shopping lines. The name lookup
  (M5) is the only mitigation in this version.
- **Saving a meal replaces its ingredients,** so ingredient ids are not stable. Nothing
  refers to them.
- **Last write wins** on meals.
- Not in this work: images, import from a URL, an ingredient catalogue, pantry, who cooks,
  meal options and ingredient types from legacy, offline, live push, copying a week, a
  configurable week start, and a finer permission model.
