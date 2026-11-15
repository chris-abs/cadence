package authz

// Identity permissions (spec §5.1). They are fixed in code and can never be
// granted by a module or, later, a per-profile override.
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

// parentGrants are every PARENT's identity rights; ownerGrants add account
// management and resetting other parents' PINs [I4]. A CHILD has none. Both
// are read-only after package initialisation.
var (
	parentGrants = []string{
		FamilyView, FamilyEdit, FamilyModulesManage, FamilyProfilesCreate,
		FamilyProfilesEdit, FamilyProfilesRole, FamilyProfilesDelete,
		FamilyPinsResetChild, FamilySessionsManage,
	}
	ownerGrants = append(append([]string{}, parentGrants...), FamilyPinsResetParent, FamilyAccountManage)
)

// identityGrants returns the identity permissions of a role. The slice is
// shared: callers must not modify it.
func identityGrants(role Role, owner bool) []string {
	switch {
	case role == Parent && owner:
		return ownerGrants
	case role == Parent:
		return parentGrants
	default:
		return nil
	}
}
