package identity

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/store"
)

// Session lifetimes (spec §3, [I2], [I3]).
const (
	FamilyIdleTimeout      = 30 * 24 * time.Hour
	FamilyAbsoluteTimeout  = 90 * 24 * time.Hour
	ProfileIdleTimeout     = 30 * time.Minute
	ProfileAbsoluteTimeout = 12 * time.Hour

	// renewEvery throttles sliding renewal so a busy tablet writes each
	// session row at most once a minute.
	renewEvery = time.Minute
)

const (
	kindFamily  = "family"
	kindProfile = "profile"
)

// Device is a validated family session: a signed-in device.
type Device struct {
	SessionID uuid.UUID
	Family    store.Family
}

// Caller is a validated profile session on its own device's family session.
type Caller struct {
	Device      Device
	SessionID   uuid.UUID
	ExpiresAt   time.Time
	Profile     store.Profile
	LockedUntil *time.Time
	Subject     authz.Subject
}

// newID returns a UUIDv7: time-ordered, so primary-key indexes stay compact.
func newID() (uuid.UUID, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("new uuid: %w", err)
	}
	return id, nil
}

// createFamilySession inserts a family session and returns its cookie token.
// deviceName must already be normalised.
func (s *Service) createFamilySession(ctx context.Context, q *store.Queries, familyID uuid.UUID, deviceName *string, userAgent string) (string, uuid.UUID, error) {
	id, err := newID()
	if err != nil {
		return "", uuid.UUID{}, err
	}
	token, hash, err := s.tokens.New()
	if err != nil {
		return "", uuid.UUID{}, err
	}
	now := s.now()
	if err := q.CreateSession(ctx, store.CreateSessionParams{
		ID: id, TokenHash: hash, Kind: kindFamily, FamilyID: familyID,
		DeviceName: deviceName, UserAgent: truncateUserAgent(userAgent),
		Now: now, IdleExpiresAt: now.Add(FamilyIdleTimeout), ExpiresAt: now.Add(FamilyAbsoluteTimeout),
	}); err != nil {
		return "", uuid.UUID{}, fmt.Errorf("create family session: %w", err)
	}
	return token, id, nil
}

// createProfileSession replaces the device's profile session (one per
// device) and returns the new token and absolute expiry.
func (s *Service) createProfileSession(ctx context.Context, q *store.Queries, device uuid.UUID, familyID, profileID uuid.UUID) (string, uuid.UUID, time.Time, error) {
	if err := q.DeleteDeviceProfileSession(ctx, &device); err != nil {
		return "", uuid.UUID{}, time.Time{}, fmt.Errorf("delete previous profile session: %w", err)
	}
	id, err := newID()
	if err != nil {
		return "", uuid.UUID{}, time.Time{}, err
	}
	token, hash, err := s.tokens.New()
	if err != nil {
		return "", uuid.UUID{}, time.Time{}, err
	}
	now := s.now()
	expires := now.Add(ProfileAbsoluteTimeout)
	if err := q.CreateSession(ctx, store.CreateSessionParams{
		ID: id, TokenHash: hash, Kind: kindProfile, FamilyID: familyID,
		ProfileID: &profileID, FamilySessionID: &device,
		Now: now, IdleExpiresAt: now.Add(ProfileIdleTimeout), ExpiresAt: expires,
	}); err != nil {
		return "", uuid.UUID{}, time.Time{}, fmt.Errorf("create profile session: %w", err)
	}
	return token, id, expires, nil
}

// window is the timing state of one session row.
type window struct {
	id                       uuid.UUID
	lastSeen, idle, absolute time.Time
}

func (w window) expired(now time.Time) bool { return !now.Before(w.idle) || !now.Before(w.absolute) }

// renew slides the idle expiry, at most once a minute per session and never
// past the absolute expiry. Passive requests (background polling) never renew,
// so polling cannot keep a tablet unlocked.
func (s *Service) renew(ctx context.Context, w window, idle time.Duration, passive bool) error {
	now := s.now()
	if passive || now.Sub(w.lastSeen) < renewEvery {
		return nil
	}
	next := now.Add(idle)
	if next.After(w.absolute) {
		next = w.absolute
	}
	if err := s.q.TouchSession(ctx, store.TouchSessionParams{ID: w.id, Now: now, IdleExpiresAt: next}); err != nil {
		return fmt.Errorf("renew session: %w", err)
	}
	return nil
}

// AuthenticateDevice validates a family-session cookie value: one query,
// plus a renewal write at most once a minute.
func (s *Service) AuthenticateDevice(ctx context.Context, token string, passive bool) (Device, error) {
	hash, ok := hashToken(token)
	if !ok {
		return Device{}, ErrFamilySessionRequired
	}
	row, err := s.q.GetFamilySession(ctx, hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrFamilySessionRequired
	}
	if err != nil {
		return Device{}, fmt.Errorf("load family session: %w", err)
	}
	w := window{id: row.Session.ID, lastSeen: row.Session.LastSeenAt, idle: row.Session.IdleExpiresAt, absolute: row.Session.ExpiresAt}
	if w.expired(s.now()) {
		return Device{}, s.expire(ctx, w.id, ErrFamilySessionRequired)
	}
	if err := s.renew(ctx, w, FamilyIdleTimeout, passive); err != nil {
		return Device{}, err
	}
	return Device{SessionID: row.Session.ID, Family: row.Family}, nil
}

// AuthenticateProfile validates a profile session together with the family
// session of the same request (R1, R2). The success path is one query for
// session + device + profile + role + family and one for module settings;
// renewal writes happen at most once a minute per session.
func (s *Service) AuthenticateProfile(ctx context.Context, familyToken, profileToken string, passive bool) (Caller, error) {
	fsHash, ok := hashToken(familyToken)
	if !ok {
		return Caller{}, ErrFamilySessionRequired
	}
	psHash, ok := hashToken(profileToken)
	if !ok {
		return Caller{}, s.classifyMiss(ctx, familyToken)
	}
	row, err := s.q.GetProfileSession(ctx, store.GetProfileSessionParams{FamilyTokenHash: fsHash, ProfileTokenHash: psHash})
	if errors.Is(err, pgx.ErrNoRows) {
		return Caller{}, s.classifyMiss(ctx, familyToken)
	}
	if err != nil {
		return Caller{}, fmt.Errorf("load profile session: %w", err)
	}

	now := s.now()
	device := window{id: *row.Session.FamilySessionID, lastSeen: row.DeviceLastSeenAt, idle: row.DeviceIdleExpiresAt, absolute: row.DeviceExpiresAt}
	if device.expired(now) {
		return Caller{}, s.expire(ctx, device.id, ErrFamilySessionRequired)
	}
	profile := window{id: row.Session.ID, lastSeen: row.Session.LastSeenAt, idle: row.Session.IdleExpiresAt, absolute: row.Session.ExpiresAt}
	if profile.expired(now) {
		return Caller{}, s.expire(ctx, profile.id, ErrProfileSessionRequired)
	}
	// A profile request counts as activity on its device too.
	if err := s.renew(ctx, device, FamilyIdleTimeout, passive); err != nil {
		return Caller{}, err
	}
	if err := s.renew(ctx, profile, ProfileIdleTimeout, passive); err != nil {
		return Caller{}, err
	}

	settings, err := s.moduleSettings(ctx, s.q, row.Family.ID)
	if err != nil {
		return Caller{}, err
	}
	return Caller{
		Device:      Device{SessionID: device.id, Family: row.Family},
		SessionID:   row.Session.ID,
		ExpiresAt:   row.Session.ExpiresAt,
		Profile:     row.Profile,
		LockedUntil: row.PinLockedUntil,
		Subject:     s.catalogue.NewSubject(row.Family.ID, row.Profile.ID, authz.Role(row.Profile.Role), row.Profile.IsOwner, settings),
	}, nil
}

// classifyMiss decides which 401 a failed profile lookup deserves: the client
// goes to login when the device itself is signed out, else to the picker.
// It runs only on the failure path.
func (s *Service) classifyMiss(ctx context.Context, familyToken string) error {
	if _, err := s.AuthenticateDevice(ctx, familyToken, true); err != nil {
		if errors.Is(err, ErrFamilySessionRequired) {
			return ErrFamilySessionRequired
		}
		return err
	}
	return ErrProfileSessionRequired
}

// expire deletes a session found past its expiry and returns reason.
func (s *Service) expire(ctx context.Context, id uuid.UUID, reason error) error {
	if err := s.q.DeleteSession(ctx, id); err != nil {
		return fmt.Errorf("delete expired session: %w", err)
	}
	return reason
}

// moduleSettings loads the family's module overrides (one primary-key prefix scan).
func (s *Service) moduleSettings(ctx context.Context, q *store.Queries, familyID uuid.UUID) ([]authz.ModuleSetting, error) {
	rows, err := q.ListFamilyModules(ctx, familyID)
	if err != nil {
		return nil, fmt.Errorf("load module settings: %w", err)
	}
	settings := make([]authz.ModuleSetting, len(rows))
	for i, r := range rows {
		settings[i] = authz.ModuleSetting{ModuleID: r.ModuleID, Enabled: r.Enabled}
	}
	return settings, nil
}

// subjectFor builds a caller's Subject outside the middleware (right after
// register or select), reading module settings with q.
func (s *Service) subjectFor(ctx context.Context, q *store.Queries, p store.Profile) (authz.Subject, error) {
	settings, err := s.moduleSettings(ctx, q, p.FamilyID)
	if err != nil {
		return authz.Subject{}, err
	}
	return s.catalogue.NewSubject(p.FamilyID, p.ID, authz.Role(p.Role), p.IsOwner, settings), nil
}
