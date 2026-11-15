package identity

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
)

// Audit event names (spec §6.4).
const (
	evFamilyRegistered     = "family.registered"
	evLoginSucceeded       = "auth.login_succeeded"
	evLoginFailed          = "auth.login_failed"
	evRateLimited          = "auth.rate_limited"
	evLogout               = "auth.logout"
	evSessionRevoked       = "session.revoked"
	evSessionRevokedOthers = "session.revoked_others"
	evProfileSelected      = "profile.selected"
	evPinFailed            = "profile.pin_failed"
	evPinLocked            = "profile.pin_locked"
	evPinChanged           = "profile.pin_changed"
	evProfileCreated       = "profile.created"
	evRoleChanged          = "profile.role_changed"
	evProfileDeleted       = "profile.deleted"
	evPasswordChanged      = "family.password_changed"
	evEmailChanged         = "family.email_changed"
	evOwnerTransferred     = "family.owner_transferred"
	evModuleToggled        = "family.module_toggled"
	evFamilyDeleted        = "family.deleted"
	evCrossOriginBlocked   = "auth.cross_origin_blocked"
)

// auditor writes audit events to the structured log. Attributes are ids and
// fixed reasons only: never emails, passwords, PINs or tokens. There is no
// audit table in v1 [I10].
type auditor struct {
	logger *slog.Logger
}

func (a auditor) event(ctx context.Context, name string, attrs ...slog.Attr) {
	a.logger.LogAttrs(ctx, slog.LevelInfo, "audit", append([]slog.Attr{slog.String("event", name)}, attrs...)...)
}

func familyAttr(id uuid.UUID) slog.Attr  { return slog.String("family_id", id.String()) }
func profileAttr(id uuid.UUID) slog.Attr { return slog.String("profile_id", id.String()) }
func actorAttr(id uuid.UUID) slog.Attr   { return slog.String("actor_id", id.String()) }
func sessionAttr(id uuid.UUID) slog.Attr { return slog.String("session_id", id.String()) }
