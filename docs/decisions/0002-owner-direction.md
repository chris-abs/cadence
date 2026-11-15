# 0002 — Owner direction: priorities, client tooling, recipe book

Date: 2026-11-15. Status: accepted (owner). Amends `docs/PLAN.md` and `docs/spec/meals.md`.

## Priority

Core platform first: **authentication, authorisation and family management** (a family
can be created, edited and deleted; profiles and roles work) must be complete and solid
before any "micro app" such as the meal planner is built. Meals work (PLAN.md M6) does
not start until identity (M3 + M4) is done.

## Client tooling

- **oxlint + oxfmt** replace ESLint + Prettier. The owner wants to adopt the Oxc toolchain.
- **Central reusable component layer.** Shared components live in one global layer and
  are used across every client-facing domain. Lesson from legacy: duplication. It had
  several Tag components, different Buttons, and the same behaviour rebuilt per module.
  One shared component per job; a module does not build its own version of something
  that already exists. How this is structured and enforced is the owner's decision.

## Default recipe book (changes the meals data model)

- Every family receives a **default recipe book** so a new Cadence has examples from
  day one.
- A family can **create its own recipes** and **edit default recipes**. Editing a default
  changes only **that family's version**; the global default, and every other family's
  view of it, is untouched (copy-on-write).
- A family can **turn the default book off** in family settings, plus the usual
  per-recipe overrides (hide a default, restore it to the original).

Implications for `docs/spec/meals.md` (to be revised before M6):

- The draft made every recipe family-owned. It now needs global default recipes plus
  per-family overrides, e.g. a default catalogue with `family_id IS NULL` and family
  rows carrying `source_recipe_id`, or a separate catalogue table. To be designed.
- Family settings gain "show default recipes"; per-family hidden defaults need storing.
- Plan entries and shopping lists must resolve to the family's version of a recipe.
- Someone has to author and maintain the default recipes (seed data and its migration
  story when defaults are updated after families have customised them).

## Product vision (added same day)

Cadence is a **family orchestration platform**, not only a meal planner: activities,
to-dos, calendar, music and other centralised family logic, signed in on a **central
family tablet** where people switch profiles and act according to their authorisation.

Implications:

- Identity is the platform core. Authorisation must be **module-aware** from the start:
  role × module × action, with modules a family can enable or disable.
- Profile switching on a shared device is the primary flow, so it must be fast, and a
  profile's rights must change the moment a parent changes them.
- Each feature is a self-contained module (server package + client feature folder)
  built on the identity core and the shared component layer.
