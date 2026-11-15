package identity

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/store"
)

// ModuleItem is a catalogue module with the family's effective state.
type ModuleItem struct {
	Module  authz.Module
	Enabled bool
}

// ListModules lists the whole catalogue with this family's state. It uses the
// settings the middleware already loaded, so it costs no query.
func (s *Service) ListModules(caller Caller) []ModuleItem {
	mods := s.catalogue.Modules()
	items := make([]ModuleItem, len(mods))
	for i, m := range mods {
		items[i] = ModuleItem{Module: m, Enabled: caller.Subject.ModuleEnabled(m.ID)}
	}
	return items
}

// SetModuleEnabled enables or disables a module for the family (PARENT).
// Unknown modules are not found.
func (s *Service) SetModuleEnabled(ctx context.Context, caller Caller, id string, enabled bool) (ModuleItem, error) {
	if !caller.Subject.Can(authz.FamilyModulesManage) {
		return ModuleItem{}, ErrForbidden
	}
	m, ok := s.catalogue.Lookup(id)
	if !ok {
		return ModuleItem{}, ErrNotFound
	}
	familyID := caller.Device.Family.ID
	if err := s.q.SetFamilyModule(ctx, store.SetFamilyModuleParams{FamilyID: familyID, ModuleID: id, Enabled: enabled}); err != nil {
		return ModuleItem{}, fmt.Errorf("set module: %w", err)
	}
	s.audit.event(ctx, evModuleToggled, familyAttr(familyID), actorAttr(caller.Profile.ID),
		slog.String("module", id), slog.Bool("enabled", enabled))
	return ModuleItem{Module: m, Enabled: enabled}, nil
}
