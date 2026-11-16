# Meal planning — server spec and data model

**Status: revised 2026-11-16, awaiting owner approval.** Decisions behind it are in
`docs/decisions/0004-meals-decisions.md`. This spec covers behaviour, data and endpoints.
Screens and client behaviour are the owner's and are not specified here.

The flow is **recipes → weekly plan → shopping list**. A family has its own recipes, which
start as a copy of the Cadence recipe book. Parents put recipes or free text on the days of
a week. From a week's plan a parent generates one shopping list that merges duplicate
ingredients; anyone in the family ticks items off.

Lines marked **(addition)** did not come from the owner; the reason is given each time.

## 1. Recipe book

The recipe book is Cadence's own catalogue of recipes, the same for every family.

| Rule | Behaviour |
|---|---|
| B1. Sign-up seeds the family | Registering a family copies every book recipe into that family's recipes, in the same transaction as the registration. |
| B2. Copies are ordinary recipes | A family edits or deletes its copies freely. Nothing a family does changes the book or another family. |
| B3. Nothing updates on its own | When the book gains a recipe or a book recipe is changed, no family's recipes change. |
| B4. The book can be browsed | A family sees every book recipe with where it stands (below). |
| B5. Adopt | Adopting a book recipe gives the family the book's current version. If the family has no copy, one is added. If it has a copy, edited or not, that copy is replaced and the family's edits are lost. The recipe keeps its id, so plan entries stay linked. |
| B6. Book off | Turning the book off removes every copy the family has not edited. Copies the family has edited stay. Plan entries that used a removed recipe stay, as free text with the recipe's name. |
| B7. Book back on | The recipes removed by B6 come back at the book's current versions. Recipes the family deleted themselves do not come back, and neither do book recipes they never had. Plan entries that became free text are not re-linked. |

Where a family stands on a book recipe:

| Status | Meaning |
|---|---|
| `not_added` | The family has no copy: the recipe is newer than their sign-up, or they deleted it |
| `current` | Their copy is unedited and matches the book |
| `update_available` | Their copy is unedited and the book has changed since |
| `edited` | They have edited their copy |

- **(addition)** Each family recipe records which book recipe it came from, the book revision
  it was copied at, and whether it has been edited. Without this B4, B5 and B6 cannot work.
- **(addition)** Any save of a copied recipe marks it edited, even if nothing changed.
  Comparing every field to decide would be more code for no real gain.
- **(addition)** Adopting while the book is off is refused (409).
- **(addition)** The book's content arrives by migration when the owner is ready. Until
  then the book is empty and every rule above still holds. A migration that changes a book
  recipe raises its revision.
- A family registered before a recipe was in the book sees it as `not_added` and adopts it.

## 2. Recipes

| Rule | Behaviour |
|---|---|
| R1. Add a recipe | Name required (1–120 characters, trimmed). Optional description, instructions, servings, prep and cook minutes, source URL. 0–100 ingredients, returned in the order entered. |
| R2. Ingredients | Each has an optional quantity (decimal > 0), an optional unit from the fixed list (§6), a required name and an optional note ("finely chopped"). A unit without a quantity is refused (422). |
| R3. Ingredient names | A lookup returns up to 10 of the family's existing ingredient names matching some text, so the same ingredient is typed the same way. |
| R4. Find a recipe | List sorted by name, with a case-insensitive search on the name. Another family's recipe id returns 404, never 403. |
| R5. Edit a recipe | A save replaces every field and the whole ingredient list in one transaction. Plan entries show the new name. Shopping lists do not change until regenerated, and report themselves stale. |
| R6. Delete a recipe | Permanent. Plan entries that used it stay as free text with its last name. |

Each recipe reports the book recipe it came from, if any, and whether it has been edited.

## 3. Weekly plan

| Rule | Behaviour |
|---|---|
| P1. Read a range | Entries between two dates (at most 42 days), each with its date, slot, position, title, optional recipe, servings and note. |
| P2. Recipe entry | Stores the recipe and a copy of its name as the title. Optional servings and note. |
| P3. Free-text entry | "Leftovers", "Pizza night": a title and no recipe. An empty title is refused (422). |
| P4. Change the plan | Move an entry to another date, slot or position; swap its recipe or text; delete it. Several entries per slot are allowed, ordered by position. |

Slots are breakfast, lunch, dinner and snack; dinner is the default. Weeks start on Monday.

**(change from the draft)** The per-family "week starts on" setting is left out. Nothing the
owner has asked for needs it, and each shopping list stores its own week start, so adding
the setting later moves no existing data.

## 4. Shopping list

| Rule | Behaviour |
|---|---|
| S1. Make the week's list | Generating a week's list creates it, or regenerates it. Lines come only from recipe entries in that week; free-text entries add nothing. |
| S2. Duplicates merge | The same normalised name with a compatible unit becomes one line (`200 g` + `0.5 kg` onion → `700 g`). Incompatible units stay separate (`2` onions and `300 g` onion). Lines with no quantity merge into one line with no quantity. Each line lists the recipes it came from. |
| S3. Servings scale | A line's quantity is multiplied by the entry's servings ÷ the recipe's servings when both are set, otherwise by 1. |
| S4. Regenerating keeps work | Manual items are untouched. A generated line that is still needed keeps its tick unless its quantity went up. Lines no longer needed are removed; new ones are added. |
| S5. The list knows it is stale | Reading a list reports `stale: true` when regenerating now would produce different lines. |
| S6. Manual items | "Kitchen roll", with optional quantity and unit. Manual items can be edited and deleted. Generated lines can only be ticked. |
| S7. Ticking | Setting checked to true or false is a set, not a toggle, so two phones never fight. The list records who ticked and when. |

There is one list per family per week, identified by the Monday it starts on. Any other
weekday is refused (422).

## 5. Roles

Authorisation detail is deferred by the owner. Until it is revisited, the permissions
already in the module catalogue apply: only parents change things, everyone views and ticks.

| Action | Permission | PARENT | CHILD |
|---|---|---|---|
| View recipes, book, plan, lists | `meals.view` | ✓ | ✓ |
| Create, edit, delete, adopt a recipe | `meals.recipes.edit` | ✓ | 403 |
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

Every table except the two book tables carries `family_id uuid NOT NULL REFERENCES
family(id) ON DELETE CASCADE`, so deleting a family removes all of its meals data.

**Family scoping:** where a row points at another family-owned row (`recipe_id`,
`list_id`), a composite foreign key `(family_id, x_id) → parent(family_id, id)` makes a link
across families impossible in the database, not only in Go. Those parents carry
`UNIQUE (family_id, id)`.

### 6.1 Recipe book

**`book_recipe`** — one recipe in the Cadence book. No `family_id`.

| Column | Type | Constraints |
|---|---|---|
| `name` | `text NOT NULL` | 1–120 characters |
| `description` | `text NOT NULL DEFAULT ''` | |
| `instructions` | `text NOT NULL DEFAULT ''` | Plain text, one step per line |
| `servings` | `smallint NULL` | 1–50 |
| `prep_minutes`, `cook_minutes` | `smallint NULL` | 0–1440 |
| `revision` | `integer NOT NULL DEFAULT 1` | Raised by any migration that changes the recipe |

**`book_recipe_ingredient`** — the same columns as `recipe_ingredient` below, keyed by
`book_recipe_id … ON DELETE CASCADE` with `UNIQUE (book_recipe_id, position)`.

**`recipe_book_setting`** — whether a family has the book on. No row means on.

| Column | Type | Constraints |
|---|---|---|
| `family_id` | `uuid PRIMARY KEY` | References `family(id) ON DELETE CASCADE`; no separate `id` |
| `enabled` | `boolean NOT NULL` | |

**`removed_book_recipe`** — what turning the book off removed, so turning it on can put
exactly those back (B7). Rows are written when the book goes off and cleared when it comes on.

| Column | Type | Constraints |
|---|---|---|
| `family_id`, `book_recipe_id` | `uuid NOT NULL` | Primary key together; `book_recipe_id` references `book_recipe(id) ON DELETE CASCADE`; no separate `id` |

Why remove and remember, not hide: a hidden recipe would need filtering out of every query
that reads recipes, and one missed filter would show a recipe the family turned off. Removing
it reuses the delete behaviour that already exists (R6).

### 6.2 Recipes

**`recipe`** — a family's recipe.

| Column | Type | Constraints |
|---|---|---|
| `name` | `text NOT NULL` | `CHECK (char_length(name) BETWEEN 1 AND 120)` |
| `description` | `text NOT NULL DEFAULT ''` | ≤ 2,000 (Go validation) |
| `instructions` | `text NOT NULL DEFAULT ''` | Plain text, one step per line; ≤ 20,000 |
| `servings` | `smallint NULL` | `CHECK (servings BETWEEN 1 AND 50)` |
| `prep_minutes`, `cook_minutes` | `smallint NULL` | `CHECK (… BETWEEN 0 AND 1440)` |
| `source_url` | `text NULL` | http(s), ≤ 2,048; a link, not an import |
| `book_recipe_id` | `uuid NULL` | References `book_recipe(id) ON DELETE SET NULL`; NULL = the family's own |
| `book_revision` | `integer NULL` | The book revision this copy was taken at |
| `edited` | `boolean NOT NULL DEFAULT false` | Set on any save of a copied recipe; cleared by adopt |
| `created_by` | `uuid NULL` | References `profile(id) ON DELETE SET NULL`; NULL for seeded copies |

Indexes: `UNIQUE (family_id, id)`; `UNIQUE (family_id, book_recipe_id)` (one copy of a book
recipe per family); `(family_id, lower(name))` for the sorted list and search.
Names are not unique: two "Chilli" recipes are allowed.

If a book recipe is ever withdrawn, families' copies stay and become their own recipes.

**(change from the draft)** No image column. Recipe images are not part of this work.

**`recipe_ingredient`** — one row per ingredient; replaced wholesale when a recipe is saved.

| Column | Type | Constraints |
|---|---|---|
| `recipe_id` | `uuid NOT NULL` | `FOREIGN KEY (family_id, recipe_id) REFERENCES recipe(family_id, id) ON DELETE CASCADE` |
| `position` | `smallint NOT NULL` | `UNIQUE (recipe_id, position)`, 0-based |
| `quantity` | `numeric(10,3) NULL` | `CHECK (quantity > 0)` |
| `unit` | `text NULL` | One of the codes below; NULL = a count ("2 onions") |
| `name` | `text NOT NULL` | 1–80 characters, as typed |
| `name_key` | generated: lower case, trimmed, inner whitespace collapsed | The merge key |
| `note` | `text NOT NULL DEFAULT ''` | Preparation, not part of the key ("diced") |
| | | `CHECK (unit IS NULL OR quantity IS NOT NULL)` |

Indexes: the unique `(recipe_id, position)`; `(family_id, name_key)` for the name lookup.

### 6.3 Weekly plan

**`meal_plan_entry`** — one thing to eat in one slot on one date. There is no "week" row.

| Column | Type | Constraints |
|---|---|---|
| `date` | `date NOT NULL` | A calendar date, no timezone |
| `slot` | `text NOT NULL DEFAULT 'dinner'` | `breakfast`, `lunch`, `dinner` or `snack` |
| `position` | `smallint NOT NULL DEFAULT 0` | Order within a slot; not unique |
| `recipe_id` | `uuid NULL` | `FOREIGN KEY (family_id, recipe_id) REFERENCES recipe(family_id, id) ON DELETE SET NULL (recipe_id)` |
| `title` | `text NOT NULL` | 1–120 characters; free text, or a copy of the recipe's name |
| `servings` | `smallint NULL` | 1–50 |
| `note` | `text NOT NULL DEFAULT ''` | ≤ 500 |
| `created_by` | `uuid NULL` | References `profile(id) ON DELETE SET NULL` |

Indexes: `(family_id, date)`; `(recipe_id)`.

"Recipe or free text" is one column being NULL. The title is always present, so a recipe
that is deleted, or removed with the book, leaves a free-text entry with no special case.
Responses show the recipe's live name while it exists.

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
| `name_key` | generated, as on `recipe_ingredient` | |
| `quantity` | `numeric(12,3) NULL` | `CHECK (quantity > 0)` |
| `unit` | `text NULL` | Same codes |
| `sources` | `text NOT NULL DEFAULT ''` | Generated only: "Lasagne, Chilli" |
| `checked_at` | `timestamptz NULL` | Ticked when set |
| `checked_by` | `uuid NULL` | References `profile(id) ON DELETE SET NULL` |

Indexes: `(list_id)`; `UNIQUE (list_id, name_key, coalesce(unit, '')) WHERE origin = 'generated'`.

Generated lines are copies, not live views of recipes. Ticks stay stable while recipes
change, and the list is exactly what the shopper saw.

### 6.5 Units and merging

Units are a fixed list, in the contract and in a database check.

| Group | Codes | Merge rule |
|---|---|---|
| Mass | `g`, `kg`, `oz`, `lb` | Convert to g (1, 1000, 28.35, 453.6) |
| Volume | `ml`, `l`, `tsp`, `tbsp`, `cup` | Convert to ml (1, 1000, 5, 15, 250) |
| Count-like | none, `clove`, `slice`, `tin`, `pack`, `bunch`, `pinch` | Merge only with the identical unit |

Generation is plain Go over rows that SQL only fetches:

1. Collect the ingredients of the week's recipe entries, scaled per S3.
2. Group by name key and unit group. If every contribution used the same unit, keep it
   (3 tbsp stays 3 tbsp); otherwise sum in the base unit and show kg or l from 1000.
3. The line's name is the most common spelling in the group. Round to 2 decimal places.
4. In one transaction holding a lock on the list: update or insert each line, keep its tick
   unless the quantity went up, delete generated lines no longer produced, store the hash.

Matching is deliberately shallow (case and whitespace). "Tomato" and "tomatoes" do not merge.
Manual items are never merged with generated lines.

## 7. Endpoints

All under `/api/meals`. Ids are uuids, dates are `YYYY-MM-DD`. Another family's id → 404.
Validation failures → 422 with field errors. Two parents saving the same recipe: last write wins.

**(addition)** Every route sits under `/meals` so later modules (to-dos, calendar) cannot
collide on names such as "lists" or "items".

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/meals/recipes?q=` | List the family's recipes (summary) | view |
| POST | `/meals/recipes` | Create a recipe with ingredients | recipes.edit |
| GET | `/meals/recipes/{recipeId}` | One recipe with ingredients | view |
| PUT | `/meals/recipes/{recipeId}` | Replace a recipe and its ingredients | recipes.edit |
| DELETE | `/meals/recipes/{recipeId}` | Delete (204) | recipes.edit |
| GET | `/meals/ingredient-names?q=` | Up to 10 matching ingredient names | view |
| GET | `/meals/recipe-book` | Whether the book is on, and every book recipe with the family's status | view |
| PUT | `/meals/recipe-book` | Turn the book on or off (B6, B7) | settings.edit |
| GET | `/meals/recipe-book/recipes/{bookRecipeId}` | One book recipe in full **(addition:** to read our version before adopting over an edited copy) | view |
| POST | `/meals/recipe-book/recipes/{bookRecipeId}/adopt` | Adopt (B5); returns the family's recipe | recipes.edit |
| GET | `/meals/plan?from=&to=` | Entries in a range | view |
| POST | `/meals/plan/entries` | Create an entry | plan.edit |
| PATCH | `/meals/plan/entries/{entryId}` | Move or change an entry | plan.edit |
| DELETE | `/meals/plan/entries/{entryId}` | Remove an entry | plan.edit |
| GET | `/meals/shopping-lists/{weekStart}` | List, items and `stale`; 404 if none yet | view |
| POST | `/meals/shopping-lists/{weekStart}/generate` | Create or regenerate | shopping.generate |
| POST | `/meals/shopping-lists/{weekStart}/items` | Add a manual item (creates the list if missing) | shopping.items.edit |
| PATCH | `/meals/shopping-items/{itemId}` | `checked` (shopping.tick); name, quantity, unit on manual items (shopping.items.edit) | see left |
| DELETE | `/meals/shopping-items/{itemId}` | Manual items only; a generated line → 422 | shopping.items.edit |

**(change from the draft)** A recipe no longer reports "used in N upcoming meals". It would
make recipes depend on the plan; a client that wants the number can read it from the plan.

## 8. Server structure

`internal/meals` holds three domains beside `internal/identity`, each one package with a
handler, service, repository and model.

| Package | One sentence | Owns |
|---|---|---|
| `meals/recipe` | A family's recipes and their relationship to the Cadence book | `recipe`, `recipe_ingredient`, `book_recipe`, `book_recipe_ingredient`, `recipe_book_setting`, `removed_book_recipe` |
| `meals/plan` | What a family eats on which day | `meal_plan_entry` |
| `meals/shopping` | The week's shopping list and its ticks | `shopping_list`, `shopping_item` |

Dependencies follow the flow and point one way: `shopping` → `plan` → `recipe`. A package
asks the one before it through a small interface it declares itself; none imports another.
Nothing in `identity` imports `meals`: sign-up seeding (B1) is a small interface declared in
`auth` and satisfied by `recipe`, wired in `internal/app`.

## 9. Build order

Each is its own pull request, in this order.

| # | Piece | Contains |
|---|---|---|
| 1 | Contract | Every endpoint in §7 added to `api/openapi.yaml` |
| 2 | Recipes | Tables in §6.2, recipe endpoints, ingredient names |
| 3 | Recipe book | Tables in §6.1, sign-up seeding, book listing, adopt, on and off |
| 4 | Weekly plan | Table in §6.3, plan endpoints |
| 5 | Shopping list | Tables in §6.4, generation, manual items, ticking |

Each piece carries its own migration and a planned test list, one line per behaviour,
written before the tests.

## 10. Risks and deferred

- **Name matching** is the main quality risk: plurals and synonyms produce duplicate lines.
  The name lookup (R3) is the only mitigation in this version.
- **Adopt discards edits** with no undo. A client should confirm first.
- **Book off is destructive for plan links:** entries that became free text are not re-linked
  when the book comes back on.
- **`ON DELETE SET NULL (recipe_id)`** needs Postgres 15 or later. Local is 17; the hosted
  version must be confirmed by the owner before the plan migration.
- **Saving a recipe replaces its ingredients,** so ingredient ids are not stable. Nothing
  refers to them.
- **Last write wins** on recipes.
- Not in this work: recipe images, import from a URL, nutrition, pantry, cost, who cooks,
  aisle grouping, offline, live push, copying a week, a configurable week start, and a
  finer permission model.
