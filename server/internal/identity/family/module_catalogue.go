package family

import "github.com/chris-abs/cadence/server/internal/models"

var catalogue = []models.Module{
	{
		ID:             "meals",
		Name:           "Meals",
		Description:    "Recipes, the weekly meal plan and shopping lists.",
		DefaultEnabled: true,
		Actions: []models.Action{
			{ID: "view", Roles: []models.Role{models.Parent, models.Child}},
			{ID: "recipes.edit", Roles: []models.Role{models.Parent}},
			{ID: "plan.edit", Roles: []models.Role{models.Parent}},
			{ID: "shopping.generate", Roles: []models.Role{models.Parent}},
			{ID: "shopping.items.edit", Roles: []models.Role{models.Parent}},
			{ID: "shopping.tick", Roles: []models.Role{models.Parent, models.Child}},
			{ID: "settings.edit", Roles: []models.Role{models.Parent}},
		},
	},
}

func lookupModule(id string) (models.Module, bool) {
	for _, m := range catalogue {
		if m.ID == id {
			return m, true
		}
	}
	return models.Module{}, false
}

func moduleStates(settings map[string]bool) []ModuleState {
	states := make([]ModuleState, len(catalogue))
	for i, m := range catalogue {
		enabled, ok := settings[m.ID]
		if !ok {
			enabled = m.DefaultEnabled
		}
		states[i] = ModuleState{Module: m, Enabled: enabled}
	}
	return states
}
