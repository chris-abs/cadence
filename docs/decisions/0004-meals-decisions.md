# 0004 — Meals decisions

Date: 2026-11-16. Status: accepted (owner) unless marked otherwise. Replaces the "Default
recipe book" section of `0002-owner-direction.md`. Specified in `docs/spec/meals.md`.

## Recipe book (owner)

- **Seeded at sign-up.** A new family's recipes start as a copy of the whole recipe book.
  "They can edit/delete all of these as they choose."
- **A recipe book section** shows every recipe Cadence seeds for new accounts. A family can
  "adopt anything we have added or adjusted since they originally registered", or adopt a
  recipe they have edited "to get it back to our default".
- **Nothing updates on its own.** A family's recipes change only when the family adopts.
- **Adopting a recipe the family has edited replaces their version.**
- **Book off:** "any recipe they've edited will be enabled if book is off but stock recipes
  will be removed".
- **Book off, recipe already on a plan:** the plan entry stays as free text with the
  recipe's name (orchestrator's recommendation, agreed).
- **Book back on:** stock recipes return at the current book versions, without any the
  family deleted themselves (orchestrator's recommendation, agreed).
- **The book's recipes are written later.** "We'll seed all of the recipes when we're
  ready." The mechanism is built first against an empty book.

This replaces the copy-on-write model, the per-recipe "hide" and the "restore to original"
described in 0002. Deleting a copy and adopting it again cover both.

## Authorisation (owner)

Deferred. "Only parents can change specs/recipes"; the finer model, and who may turn the
book off, are to be decided later. The meals permissions already in the module catalogue
stand until then. They were written by the orchestrator before the spec was agreed.

## Draft defaults (owner)

The recommended defaults in the first draft of the meals spec were accepted as a whole:
structured ingredients, one shopping list per week, permanent recipe delete, free-text plan
entries and several entries per slot, dinner first with a Monday week, optional servings
scaling, a 250 ml cup, tick-only generated lines, children view and tick, plain-text
instructions, and no import, pantry, nutrition, cost or who-cooks.

## Scope (owner)

Server only: "let's get the data structures and endpoints up first." Contract first, then
the server in small pull requests. Nothing in `client/`. Screens are out of the spec.

## Orchestrator's additions and changes (awaiting owner approval with the spec)

- Each family recipe records its book recipe, the revision copied and whether it was edited.
- Any save of a copied recipe marks it edited.
- Adopting while the book is off is refused.
- Book off deletes the unedited copies and remembers which, instead of hiding them.
- Every meals route sits under `/meals`.
- One extra endpoint to read a single book recipe in full.
- Left out of the draft: the per-family week-start setting, the recipe image column, and
  the "used in N upcoming meals" count.
