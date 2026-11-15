package authz

import (
	"context"
	"errors"
	"slices"
	"strings"

	"github.com/google/uuid"
)

// ErrForbidden means the subject lacks the permission. Handlers map it to
// 403 forbidden.
var ErrForbidden = errors.New("authz: forbidden")

// Subject is the caller of a profile-session request: who they are and what
// their family has enabled. The identity middleware builds it from one
// session lookup and one module-settings lookup; nothing is cached across
// requests, so a demotion or a disabled module applies to the next request.
type Subject struct {
	FamilyID  uuid.UUID
	ProfileID uuid.UUID
	Role      Role
	IsOwner   bool

	catalogue *Catalogue
	settings  []ModuleSetting
}

// NewSubject combines a caller with the catalogue and their family's module
// settings. settings is retained, not copied.
func (c *Catalogue) NewSubject(familyID, profileID uuid.UUID, role Role, isOwner bool, settings []ModuleSetting) Subject {
	return Subject{FamilyID: familyID, ProfileID: profileID, Role: role, IsOwner: isOwner, catalogue: c, settings: settings}
}

// Can reports whether the subject holds perm, a "<module>.<action>" string:
// moduleEnabled(family, module) AND roleGrants(module, action, role). Identity
// permissions ("family.…") depend on the role and owner flag alone. It does
// not allocate.
func (s Subject) Can(perm string) bool {
	module, action, ok := strings.Cut(perm, ".")
	if !ok || s.catalogue == nil {
		return false
	}
	if module == identityModule {
		return slices.Contains(identityGrants(s.Role, s.IsOwner), perm)
	}
	e, ok := s.catalogue.byID[module]
	if !ok || !s.catalogue.Enabled(module, s.settings) {
		return false
	}
	return e.grants[s.Role][action]
}

// ModuleEnabled reports whether the subject's family has module id enabled.
func (s Subject) ModuleEnabled(id string) bool {
	return s.catalogue != nil && s.catalogue.Enabled(id, s.settings)
}

// EnabledModules lists the family's enabled modules in catalogue order.
func (s Subject) EnabledModules() []Module {
	if s.catalogue == nil {
		return nil
	}
	var out []Module
	for _, m := range s.catalogue.modules {
		if s.catalogue.Enabled(m.ID, s.settings) {
			out = append(out, m)
		}
	}
	return out
}

// Permissions lists every permission the subject holds now, sorted. It feeds
// Me.permissions so the client hides exactly what the server refuses.
func (s Subject) Permissions() []string {
	perms := slices.Clone(identityGrants(s.Role, s.IsOwner))
	for _, m := range s.EnabledModules() {
		for _, a := range m.Actions {
			if s.catalogue.byID[m.ID].grants[s.Role][a.ID] {
				perms = append(perms, m.ID+"."+a.ID)
			}
		}
	}
	slices.Sort(perms)
	return slices.Compact(perms)
}

type subjectKey struct{}

// WithSubject returns ctx carrying s.
func WithSubject(ctx context.Context, s Subject) context.Context {
	return context.WithValue(ctx, subjectKey{}, s)
}

// SubjectFrom returns the subject the profile middleware stored in ctx.
func SubjectFrom(ctx context.Context) (Subject, bool) {
	s, ok := ctx.Value(subjectKey{}).(Subject)
	return s, ok
}

// Require returns ErrForbidden unless ctx's subject holds perm. A context
// without a subject (a route wired without the profile middleware) is
// forbidden rather than a panic, so a wiring mistake fails closed.
func Require(ctx context.Context, perm string) error {
	s, ok := SubjectFrom(ctx)
	if !ok || !s.Can(perm) {
		return ErrForbidden
	}
	return nil
}
