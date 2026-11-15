package models

import "slices"

const (
	FamilyView            = "family.view"
	FamilyEdit            = "family.edit"
	FamilyModulesManage   = "family.modules.manage"
	FamilyProfilesCreate  = "family.profiles.create"
	FamilyProfilesEdit    = "family.profiles.edit"
	FamilyProfilesRole    = "family.profiles.role"
	FamilyProfilesDelete  = "family.profiles.delete"
	FamilyPinsResetChild  = "family.pins.reset_child"
	FamilyPinsResetParent = "family.pins.reset_parent"
	FamilySessionsManage  = "family.sessions.manage"
	FamilyAccountManage   = "family.account.manage"
)

var parentGrants = []string{
	FamilyView, FamilyEdit, FamilyModulesManage, FamilyProfilesCreate,
	FamilyProfilesEdit, FamilyProfilesRole, FamilyProfilesDelete,
	FamilyPinsResetChild, FamilySessionsManage,
}

var ownerGrants = []string{FamilyPinsResetParent, FamilyAccountManage}

type Action struct {
	ID    string
	Roles []Role
}

type Module struct {
	ID             string
	Name           string
	Description    string
	DefaultEnabled bool
	Actions        []Action
}

func Permissions(role Role, owner bool, enabled []Module) []string {
	var perms []string
	if role == Parent {
		perms = append(perms, parentGrants...)
		if owner {
			perms = append(perms, ownerGrants...)
		}
	}
	for _, m := range enabled {
		for _, a := range m.Actions {
			if slices.Contains(a.Roles, role) {
				perms = append(perms, m.ID+"."+a.ID)
			}
		}
	}
	slices.Sort(perms)
	return slices.Compact(perms)
}
