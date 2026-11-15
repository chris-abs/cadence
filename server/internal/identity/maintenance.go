package identity

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/store"
)

// CleanupInterval is how often expired sessions are swept (spec §3).
const CleanupInterval = time.Hour

// RunCleanup deletes expired sessions every interval until ctx is cancelled,
// then returns. main runs it in one goroutine tied to server shutdown. A
// failed sweep is logged and retried next tick: lookups already reject and
// delete expired rows, so the sweep only reclaims space.
func (s *Service) RunCleanup(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := s.CleanupExpiredSessions(ctx); err != nil && ctx.Err() == nil {
				s.logger.ErrorContext(ctx, "session cleanup failed", "err", err)
			}
		}
	}
}

// CleanupExpiredSessions deletes sessions past their idle or absolute expiry.
func (s *Service) CleanupExpiredSessions(ctx context.Context) (int64, error) {
	n, err := s.q.DeleteExpiredSessions(ctx, s.now())
	if err != nil {
		return 0, fmt.Errorf("delete expired sessions: %w", err)
	}
	if n > 0 {
		s.logger.InfoContext(ctx, "expired sessions deleted", "count", n)
	}
	return n, nil
}

// ErrUnknownFamily is returned by ResetPassword for an email with no family.
var ErrUnknownFamily = errors.New("no family has that email")

// ResetPassword is the operator's answer to a forgotten family password
// [I7]: it sets a fresh random password, signs every device out, and returns
// the new password once for the operator to pass on. The owner should change
// it after signing in.
func (s *Service) ResetPassword(ctx context.Context, email string) (string, error) {
	email, msg := normalizeEmail(email)
	if msg != "" {
		return "", fmt.Errorf("invalid email: %s", msg)
	}
	password := rand.Text() // 26 base32 characters, 128 bits
	hash, err := s.hasher.Hash(password)
	if err != nil {
		return "", err
	}
	var familyID string
	err = s.inTx(ctx, func(q *store.Queries) error {
		f, err := q.GetFamilyByEmail(ctx, email)
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrUnknownFamily
		}
		if err != nil {
			return fmt.Errorf("load family: %w", err)
		}
		familyID = f.ID.String()
		if err := q.UpdateFamilyPassword(ctx, store.UpdateFamilyPasswordParams{PasswordHash: hash, ID: f.ID}); err != nil {
			return fmt.Errorf("update password: %w", err)
		}
		// An empty keep list, not nil: NULL would make "id <> ALL(keep)" match nothing.
		if _, err := q.DeleteFamilySessionsExcept(ctx, store.DeleteFamilySessionsExceptParams{FamilyID: f.ID, Keep: []uuid.UUID{}}); err != nil {
			return fmt.Errorf("sign out sessions: %w", err)
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	s.audit.event(ctx, evPasswordChanged, slog.String("family_id", familyID), slog.String("by", "operator"))
	return password, nil
}
