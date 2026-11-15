// Package authz decides what a profile may do: role × module × action
// (docs/spec/identity.md §5). The catalogue of modules is code, built once at
// startup; a request's Subject combines it with the caller's role and the
// family's module settings, read fresh from the database on every request.
package authz

import (
	"errors"
	"fmt"
	"regexp"
	"slices"
)

// Role is a profile's role. The values match the contract's Role enum and the
// profile.role column.
type Role string

const (
	Parent Role = "PARENT"
	Child  Role = "CHILD"
)

// Valid reports whether r is a known role.
func (r Role) Valid() bool { return r == Parent || r == Child }

// Action is one thing a module lets a profile do, and the roles granted it.
// Its permission string is "<module>.<action>".
type Action struct {
	ID    string
	Roles []Role
}

// Module is one feature module's catalogue entry. Each module package exports
// one and app.NewHandler registers it.
type Module struct {
	ID             string
	Name           string
	Description    string
	DefaultEnabled bool
	Actions        []Action
}

// identityModule is the reserved prefix of the identity permissions.
const identityModule = "family"

// moduleIDPattern matches family_module.module_id's CHECK constraint.
var moduleIDPattern = regexp.MustCompile(`^[a-z][a-z0-9_]{1,31}$`)

// Catalogue is the immutable set of modules. Grants are precomputed per role
// so permission checks are map lookups with no allocation.
type Catalogue struct {
	modules []Module
	byID    map[string]*entry
}

type entry struct {
	module Module
	grants map[Role]map[string]bool // role -> action id -> granted
}

// NewCatalogue validates and indexes modules. It is called once at startup;
// an invalid entry is a programming error reported before the server starts.
func NewCatalogue(modules ...Module) (*Catalogue, error) {
	c := &Catalogue{byID: make(map[string]*entry, len(modules))}
	var errs []error
	for _, m := range modules {
		if !moduleIDPattern.MatchString(m.ID) || m.ID == identityModule {
			errs = append(errs, fmt.Errorf("module id %q is invalid or reserved", m.ID))
			continue
		}
		if _, dup := c.byID[m.ID]; dup {
			errs = append(errs, fmt.Errorf("module %q registered twice", m.ID))
			continue
		}
		e := &entry{module: m, grants: map[Role]map[string]bool{Parent: {}, Child: {}}}
		for _, a := range m.Actions {
			if a.ID == "" {
				errs = append(errs, fmt.Errorf("module %q has an action without an id", m.ID))
				continue
			}
			for _, r := range a.Roles {
				if !r.Valid() {
					errs = append(errs, fmt.Errorf("module %q action %q: unknown role %q", m.ID, a.ID, r))
					continue
				}
				e.grants[r][a.ID] = true
			}
		}
		c.byID[m.ID] = e
		c.modules = append(c.modules, m)
	}
	if err := errors.Join(errs...); err != nil {
		return nil, fmt.Errorf("authz catalogue: %w", err)
	}
	return c, nil
}

// Modules returns every module in registration order.
func (c *Catalogue) Modules() []Module { return slices.Clone(c.modules) }

// Lookup returns the module with id.
func (c *Catalogue) Lookup(id string) (Module, bool) {
	e, ok := c.byID[id]
	if !ok {
		return Module{}, false
	}
	return e.module, true
}

// ModuleSetting is a family's stored override of a module's default
// (one family_module row).
type ModuleSetting struct {
	ModuleID string
	Enabled  bool
}

// Enabled reports a module's effective state: the family's setting if it has
// one, else the module's default. Unknown modules are never enabled.
func (c *Catalogue) Enabled(id string, settings []ModuleSetting) bool {
	e, ok := c.byID[id]
	if !ok {
		return false
	}
	// Settings hold at most one row per catalogued module, so a linear scan
	// beats building a map per request.
	for _, s := range settings {
		if s.ModuleID == id {
			return s.Enabled
		}
	}
	return e.module.DefaultEnabled
}
