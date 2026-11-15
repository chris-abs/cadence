package identity

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
)

// deviceItem is one signed-in device in GET /auth/sessions.
type deviceItem struct {
	Row     identitydb.ListDevicesRow
	Current bool
}

// listDevices lists the family's live devices (PARENT).
func (s *Service) listDevices(ctx context.Context, caller callerSession) ([]deviceItem, error) {
	if !caller.Subject.Can(authz.FamilySessionsManage) {
		return nil, ErrForbidden
	}
	rows, err := s.q.ListDevices(ctx, identitydb.ListDevicesParams{FamilyID: caller.device.Family.ID, Now: s.now()})
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	items := make([]deviceItem, len(rows))
	for i, r := range rows {
		items[i] = deviceItem{Row: r, Current: r.ID == caller.device.SessionID}
	}
	return items, nil
}

// revokeDevice signs one device out (PARENT). It reports whether that was
// the caller's own device, whose cookies the handler then clears.
func (s *Service) revokeDevice(ctx context.Context, caller callerSession, id uuid.UUID) (bool, error) {
	if !caller.Subject.Can(authz.FamilySessionsManage) {
		return false, ErrForbidden
	}
	n, err := s.q.DeleteDevice(ctx, identitydb.DeleteDeviceParams{FamilyID: caller.device.Family.ID, ID: id})
	if err != nil {
		return false, fmt.Errorf("revoke device: %w", err)
	}
	if n == 0 {
		return false, ErrNotFound
	}
	s.audit.event(ctx, evSessionRevoked, familyAttr(caller.device.Family.ID), sessionAttr(id), actorAttr(caller.Profile.ID))
	return id == caller.device.SessionID, nil
}

// revokeOtherDevices signs out every device but this one (PARENT).
func (s *Service) revokeOtherDevices(ctx context.Context, caller callerSession) error {
	if !caller.Subject.Can(authz.FamilySessionsManage) {
		return ErrForbidden
	}
	n, err := s.q.DeleteOtherDevices(ctx, identitydb.DeleteOtherDevicesParams{FamilyID: caller.device.Family.ID, Keep: caller.device.SessionID})
	if err != nil {
		return fmt.Errorf("revoke other devices: %w", err)
	}
	s.audit.event(ctx, evSessionRevokedOthers, familyAttr(caller.device.Family.ID), sessionAttr(caller.device.SessionID),
		actorAttr(caller.Profile.ID), slog.Int64("revoked", n))
	return nil
}
