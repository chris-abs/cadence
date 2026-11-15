package identity

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
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

// Family is the caller's family as other domains see it.
type Family struct {
	ID              uuid.UUID
	Name            string
	AutoLockMinutes int
}

// Profile is the calling profile as other domains see it.
type Profile struct {
	ID       uuid.UUID
	FamilyID uuid.UUID
	Name     string
	Role     authz.Role
	IsOwner  bool
	Timezone string // IANA name, e.g. for "today" in the caller's zone
}

// Caller is an authenticated profile-session caller, as exported to feature
// modules. It holds no database rows, hashes or session ids; Subject answers
// permission checks.
type Caller struct {
	Family  Family
	Profile Profile
	Subject authz.Subject
}

// deviceSession is a validated family session: a signed-in device. It keeps
// the family row (password hash included) for re-authentication, so it never
// leaves this package.
type deviceSession struct {
	SessionID uuid.UUID
	Family    identitydb.Family
}

// callerSession is a validated profile session on its own device's family
// session: the package-internal form of Caller.
type callerSession struct {
	device      deviceSession
	SessionID   uuid.UUID
	ExpiresAt   time.Time
	Profile     identitydb.Profile
	LockedUntil *time.Time
	Subject     authz.Subject
}

// public is the caller as other domains may see it.
func (c callerSession) public() Caller {
	f, p := c.device.Family, c.Profile
	return Caller{
		Family: Family{ID: f.ID, Name: f.Name, AutoLockMinutes: int(f.AutoLockMinutes)},
		Profile: Profile{
			ID: p.ID, FamilyID: p.FamilyID, Name: p.Name, Role: authz.Role(p.Role),
			IsOwner: p.IsOwner, Timezone: p.Timezone,
		},
		Subject: c.Subject,
	}
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
func (s *Service) createFamilySession(ctx context.Context, q *identitydb.Queries, familyID uuid.UUID, deviceName *string, userAgent string) (string, uuid.UUID, error) {
	id, err := newID()
	if err != nil {
		return "", uuid.UUID{}, err
	}
	token, hash, err := s.tokens.New()
	if err != nil {
		return "", uuid.UUID{}, err
	}
	now := s.now()
	if err := q.CreateSession(ctx, identitydb.CreateSessionParams{
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
func (s *Service) createProfileSession(ctx context.Context, q *identitydb.Queries, device uuid.UUID, familyID, profileID uuid.UUID) (string, uuid.UUID, time.Time, error) {
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
	if err := q.CreateSession(ctx, identitydb.CreateSessionParams{
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
	if err := s.q.TouchSession(ctx, identitydb.TouchSessionParams{ID: w.id, Now: now, IdleExpiresAt: next}); err != nil {
		return fmt.Errorf("renew session: %w", err)
	}
	return nil
}

// authenticateDevice validates a family-session cookie value: one query,
// plus a renewal write at most once a minute.
func (s *Service) authenticateDevice(ctx context.Context, token string, passive bool) (deviceSession, error) {
	hash, ok := hashToken(token)
	if !ok {
		return deviceSession{}, ErrFamilySessionRequired
	}
	row, err := s.q.GetFamilySession(ctx, hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return deviceSession{}, ErrFamilySessionRequired
	}
	if err != nil {
		return deviceSession{}, fmt.Errorf("load family session: %w", err)
	}
	w := window{id: row.Session.ID, lastSeen: row.Session.LastSeenAt, idle: row.Session.IdleExpiresAt, absolute: row.Session.ExpiresAt}
	if w.expired(s.now()) {
		return deviceSession{}, s.expire(ctx, w.id, ErrFamilySessionRequired)
	}
	if err := s.renew(ctx, w, FamilyIdleTimeout, passive); err != nil {
		return deviceSession{}, err
	}
	return deviceSession{SessionID: row.Session.ID, Family: row.Family}, nil
}

// authenticateProfile validates a profile session together with the family
// session of the same request (R1, R2). The success path is one query for
// session + device + profile + role + family and one for module settings;
// renewal writes happen at most once a minute per session.
func (s *Service) authenticateProfile(ctx context.Context, familyToken, profileToken string, passive bool) (callerSession, error) {
	fsHash, ok := hashToken(familyToken)
	if !ok {
		return callerSession{}, ErrFamilySessionRequired
	}
	psHash, ok := hashToken(profileToken)
	if !ok {
		return callerSession{}, s.classifyMiss(ctx, familyToken)
	}
	row, err := s.q.GetProfileSession(ctx, identitydb.GetProfileSessionParams{FamilyTokenHash: fsHash, ProfileTokenHash: psHash})
	if errors.Is(err, pgx.ErrNoRows) {
		return callerSession{}, s.classifyMiss(ctx, familyToken)
	}
	if err != nil {
		return callerSession{}, fmt.Errorf("load profile session: %w", err)
	}

	now := s.now()
	device := window{id: *row.Session.FamilySessionID, lastSeen: row.DeviceLastSeenAt, idle: row.DeviceIdleExpiresAt, absolute: row.DeviceExpiresAt}
	if device.expired(now) {
		return callerSession{}, s.expire(ctx, device.id, ErrFamilySessionRequired)
	}
	profile := window{id: row.Session.ID, lastSeen: row.Session.LastSeenAt, idle: row.Session.IdleExpiresAt, absolute: row.Session.ExpiresAt}
	if profile.expired(now) {
		return callerSession{}, s.expire(ctx, profile.id, ErrProfileSessionRequired)
	}
	// A profile request counts as activity on its device too.
	if err := s.renew(ctx, device, FamilyIdleTimeout, passive); err != nil {
		return callerSession{}, err
	}
	if err := s.renew(ctx, profile, ProfileIdleTimeout, passive); err != nil {
		return callerSession{}, err
	}

	settings, err := s.moduleSettings(ctx, s.q, row.Family.ID)
	if err != nil {
		return callerSession{}, err
	}
	return callerSession{
		device:      deviceSession{SessionID: device.id, Family: row.Family},
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
	if _, err := s.authenticateDevice(ctx, familyToken, true); err != nil {
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
func (s *Service) moduleSettings(ctx context.Context, q *identitydb.Queries, familyID uuid.UUID) ([]authz.ModuleSetting, error) {
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
func (s *Service) subjectFor(ctx context.Context, q *identitydb.Queries, p identitydb.Profile) (authz.Subject, error) {
	settings, err := s.moduleSettings(ctx, q, p.FamilyID)
	if err != nil {
		return authz.Subject{}, err
	}
	return s.catalogue.NewSubject(p.FamilyID, p.ID, authz.Role(p.Role), p.IsOwner, settings), nil
}
