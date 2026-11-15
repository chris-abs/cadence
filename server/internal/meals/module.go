// Package meals is the meal-planning module (docs/spec/meals.md). Only its
// catalogue entry exists so far; its routes arrive in milestone 6.
package meals

import "github.com/chris-abs/cadence/server/internal/authz"

// Module is the meals catalogue entry. Action ids follow meals.md §3; each is
// checked as "meals.<id>" with authz.Require.
var Module = authz.Module{
	ID:             "meals",
	Name:           "Meals",
	Description:    "Recipes, the weekly meal plan and shopping lists.",
	DefaultEnabled: true,
	Actions: []authz.Action{
		{ID: "view", Roles: []authz.Role{authz.Parent, authz.Child}},
		{ID: "recipes.edit", Roles: []authz.Role{authz.Parent}},
		{ID: "plan.edit", Roles: []authz.Role{authz.Parent}},
		{ID: "shopping.generate", Roles: []authz.Role{authz.Parent}},
		{ID: "shopping.items.edit", Roles: []authz.Role{authz.Parent}},
		{ID: "shopping.tick", Roles: []authz.Role{authz.Parent, authz.Child}},
		{ID: "settings.edit", Roles: []authz.Role{authz.Parent}},
	},
}
