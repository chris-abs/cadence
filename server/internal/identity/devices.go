package identity

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/store"
)

// DeviceItem is one signed-in device in GET /auth/sessions.
type DeviceItem struct {
	Row     store.ListDevicesRow
	Current bool
}

// ListDevices lists the family's live devices (PARENT).
func (s *Service) ListDevices(ctx context.Context, caller Caller) ([]DeviceItem, error) {
	if !caller.Subject.Can(authz.FamilySessionsManage) {
		return nil, ErrForbidden
	}
	rows, err := s.q.ListDevices(ctx, store.ListDevicesParams{FamilyID: caller.Device.Family.ID, Now: s.now()})
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	items := make([]DeviceItem, len(rows))
	for i, r := range rows {
		items[i] = DeviceItem{Row: r, Current: r.ID == caller.Device.SessionID}
	}
	return items, nil
}

// RevokeDevice signs one device out (PARENT). It reports whether that was
// the caller's own device, whose cookies the handler then clears.
func (s *Service) RevokeDevice(ctx context.Context, caller Caller, id uuid.UUID) (bool, error) {
	if !caller.Subject.Can(authz.FamilySessionsManage) {
		return false, ErrForbidden
	}
	n, err := s.q.DeleteDevice(ctx, store.DeleteDeviceParams{FamilyID: caller.Device.Family.ID, ID: id})
	if err != nil {
		return false, fmt.Errorf("revoke device: %w", err)
	}
	if n == 0 {
		return false, ErrNotFound
	}
	s.audit.event(ctx, evSessionRevoked, familyAttr(caller.Device.Family.ID), sessionAttr(id), actorAttr(caller.Profile.ID))
	return id == caller.Device.SessionID, nil
}

// RevokeOtherDevices signs out every device but this one (PARENT).
func (s *Service) RevokeOtherDevices(ctx context.Context, caller Caller) error {
	if !caller.Subject.Can(authz.FamilySessionsManage) {
		return ErrForbidden
	}
	n, err := s.q.DeleteOtherDevices(ctx, store.DeleteOtherDevicesParams{FamilyID: caller.Device.Family.ID, Keep: caller.Device.SessionID})
	if err != nil {
		return fmt.Errorf("revoke other devices: %w", err)
	}
	s.audit.event(ctx, evSessionRevokedOthers, familyAttr(caller.Device.Family.ID), sessionAttr(caller.Device.SessionID),
		actorAttr(caller.Profile.ID), slog.Int64("revoked", n))
	return nil
}
