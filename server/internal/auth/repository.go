package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/auth/internal/authdb"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/db"
)

type Repository struct {
	q *authdb.Queries
}

func NewRepository(conn db.DBTX) *Repository {
	return &Repository{q: authdb.New(conn)}
}

func (r *Repository) EndProfileSessions(ctx context.Context, conn db.DBTX, familyID, profileID uuid.UUID, keep []uuid.UUID) error {
	if err := authdb.New(conn).DeleteProfileSessionsOf(ctx, authdb.DeleteProfileSessionsOfParams{
		ProfileID: &profileID, FamilyID: familyID, Keep: nonNil(keep),
	}); err != nil {
		return fmt.Errorf("sign out profile: %w", err)
	}
	return nil
}

func (r *Repository) lockRegistration(ctx context.Context) error {
	if err := r.q.LockRegistration(ctx, registrationLockKey); err != nil {
		return fmt.Errorf("lock registration: %w", err)
	}
	return nil
}

type newSession struct {
	id, familyID            uuid.UUID
	hash                    []byte
	kind                    string
	profileID, familySessID *uuid.UUID
	deviceName, userAgent   *string
	now, idle, expires      time.Time
}

func (r *Repository) createSession(ctx context.Context, s newSession) error {
	if err := r.q.CreateSession(ctx, authdb.CreateSessionParams{
		ID: s.id, TokenHash: s.hash, Kind: s.kind, FamilyID: s.familyID,
		ProfileID: s.profileID, FamilySessionID: s.familySessID,
		DeviceName: s.deviceName, UserAgent: s.userAgent,
		Now: s.now, IdleExpiresAt: s.idle, ExpiresAt: s.expires,
	}); err != nil {
		return fmt.Errorf("create %s session: %w", s.kind, err)
	}
	return nil
}

func (r *Repository) familySession(ctx context.Context, hash []byte) (authdb.Session, error) {
	row, err := r.q.GetFamilySession(ctx, hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return authdb.Session{}, models.ErrFamilySessionRequired
	}
	if err != nil {
		return authdb.Session{}, fmt.Errorf("load family session: %w", err)
	}
	return row, nil
}

func (r *Repository) profileSession(ctx context.Context, familyHash, profileHash []byte) (authdb.GetProfileSessionRow, bool, error) {
	row, err := r.q.GetProfileSession(ctx, authdb.GetProfileSessionParams{FamilyTokenHash: familyHash, ProfileTokenHash: profileHash})
	if errors.Is(err, pgx.ErrNoRows) {
		return row, false, nil
	}
	if err != nil {
		return row, false, fmt.Errorf("load profile session: %w", err)
	}
	return row, true, nil
}

func (r *Repository) touch(ctx context.Context, id uuid.UUID, now, idle time.Time) error {
	if err := r.q.TouchSession(ctx, authdb.TouchSessionParams{ID: id, Now: now, IdleExpiresAt: idle}); err != nil {
		return fmt.Errorf("renew session: %w", err)
	}
	return nil
}

func (r *Repository) deleteSession(ctx context.Context, id uuid.UUID) error {
	if err := r.q.DeleteSession(ctx, id); err != nil {
		return fmt.Errorf("delete expired session: %w", err)
	}
	return nil
}

func (r *Repository) deleteDeviceByToken(ctx context.Context, hash []byte) ([]authdb.DeleteFamilySessionByTokenRow, error) {
	rows, err := r.q.DeleteFamilySessionByToken(ctx, hash)
	if err != nil {
		return nil, fmt.Errorf("delete device session: %w", err)
	}
	return rows, nil
}

func (r *Repository) deleteDeviceProfileSession(ctx context.Context, device uuid.UUID) error {
	if err := r.q.DeleteDeviceProfileSession(ctx, &device); err != nil {
		return fmt.Errorf("delete profile session: %w", err)
	}
	return nil
}

func (r *Repository) deleteFamilySessionsExcept(ctx context.Context, familyID uuid.UUID, keep []uuid.UUID) error {
	if err := r.q.DeleteFamilySessionsExcept(ctx, authdb.DeleteFamilySessionsExceptParams{FamilyID: familyID, Keep: nonNil(keep)}); err != nil {
		return fmt.Errorf("sign out sessions: %w", err)
	}
	return nil
}

func (r *Repository) deleteDevice(ctx context.Context, familyID, id uuid.UUID) (bool, error) {
	n, err := r.q.DeleteDevice(ctx, authdb.DeleteDeviceParams{FamilyID: familyID, ID: id})
	if err != nil {
		return false, fmt.Errorf("revoke device: %w", err)
	}
	return n > 0, nil
}

func (r *Repository) deleteOtherDevices(ctx context.Context, familyID, keep uuid.UUID) (int64, error) {
	n, err := r.q.DeleteOtherDevices(ctx, authdb.DeleteOtherDevicesParams{FamilyID: familyID, Keep: keep})
	if err != nil {
		return 0, fmt.Errorf("revoke other devices: %w", err)
	}
	return n, nil
}

func (r *Repository) devices(ctx context.Context, familyID uuid.UUID, now time.Time) ([]Device, error) {
	rows, err := r.q.ListDevices(ctx, authdb.ListDevicesParams{FamilyID: familyID, Now: now})
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	out := make([]Device, len(rows))
	for i, d := range rows {
		out[i] = Device{
			ID: d.ID, DeviceName: d.DeviceName, UserAgent: d.UserAgent, CreatedAt: d.CreatedAt,
			LastSeenAt: d.LastSeenAt, ActiveProfileID: d.ActiveProfileID, ActiveProfileName: d.ActiveProfileName,
		}
	}
	return out, nil
}

func (r *Repository) deleteExpired(ctx context.Context, now time.Time) (int64, error) {
	n, err := r.q.DeleteExpiredSessions(ctx, now)
	if err != nil {
		return 0, fmt.Errorf("delete expired sessions: %w", err)
	}
	return n, nil
}

// A nil keep list is sent as NULL, and id <> ALL(NULL) matches no rows.
func nonNil(ids []uuid.UUID) []uuid.UUID {
	if ids == nil {
		return []uuid.UUID{}
	}
	return ids
}
