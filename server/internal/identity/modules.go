package identity

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
)

// moduleItem is a catalogue module with the family's effective state.
type moduleItem struct {
	Module  authz.Module
	Enabled bool
}

// listModules lists the whole catalogue with this family's state. It uses the
// settings the middleware already loaded, so it costs no query.
func (s *Service) listModules(caller callerSession) []moduleItem {
	mods := s.catalogue.Modules()
	items := make([]moduleItem, len(mods))
	for i, m := range mods {
		items[i] = moduleItem{Module: m, Enabled: caller.Subject.ModuleEnabled(m.ID)}
	}
	return items
}

// setModuleEnabled enables or disables a module for the family (PARENT).
// Unknown modules are not found.
func (s *Service) setModuleEnabled(ctx context.Context, caller callerSession, id string, enabled bool) (moduleItem, error) {
	if !caller.Subject.Can(authz.FamilyModulesManage) {
		return moduleItem{}, ErrForbidden
	}
	m, ok := s.catalogue.Lookup(id)
	if !ok {
		return moduleItem{}, ErrNotFound
	}
	familyID := caller.device.Family.ID
	if err := s.q.SetFamilyModule(ctx, identitydb.SetFamilyModuleParams{FamilyID: familyID, ModuleID: id, Enabled: enabled}); err != nil {
		return moduleItem{}, fmt.Errorf("set module: %w", err)
	}
	s.audit.event(ctx, evModuleToggled, familyAttr(familyID), actorAttr(caller.Profile.ID),
		slog.String("module", id), slog.Bool("enabled", enabled))
	return moduleItem{Module: m, Enabled: enabled}, nil
}
