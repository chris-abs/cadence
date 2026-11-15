package identity

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/ratelimit"
)

// RegistrationMode is ALLOW_REGISTRATION (spec §6.1).
type RegistrationMode string

const (
	// RegistrationFirst opens registration only while no family exists.
	RegistrationFirst  RegistrationMode = "first"
	RegistrationOpen   RegistrationMode = "open"
	RegistrationClosed RegistrationMode = "closed"
)

// Valid reports whether m is a known mode.
func (m RegistrationMode) Valid() bool {
	return m == RegistrationFirst || m == RegistrationOpen || m == RegistrationClosed
}

// Deps are the Service's collaborators. Every one is required; tests inject a
// fake clock and a low-cost hasher, production the real ones.
type Deps struct {
	Pool         *pgxpool.Pool
	Logger       *slog.Logger
	Catalogue    *authz.Catalogue
	Hasher       passhash.Hasher
	Tokens       TokenSource
	Now          func() time.Time
	Registration RegistrationMode
}

// Service is the identity domain: every rule in docs/spec/identity.md that is
// not about HTTP lives here. It owns the identity tables; nothing outside this
// package queries them.
type Service struct {
	pool         *pgxpool.Pool
	q            *identitydb.Queries
	logger       *slog.Logger
	audit        auditor
	catalogue    *authz.Catalogue
	hasher       passhash.Hasher
	tokens       TokenSource
	now          func() time.Time
	registration RegistrationMode
	limits       limits

	// dummyHash is compared against when a login email is unknown, so an
	// unknown email costs the same bcrypt time as a wrong password (§6.3).
	dummyHash string
}

// NewService builds a Service. It hashes the timing dummy once, which costs
// one bcrypt at startup.
func NewService(d Deps) (*Service, error) {
	if d.Pool == nil || d.Logger == nil || d.Catalogue == nil || d.Hasher == nil || d.Now == nil {
		return nil, errors.New("identity: missing dependency")
	}
	if !d.Registration.Valid() {
		return nil, fmt.Errorf("identity: invalid registration mode %q", d.Registration)
	}
	dummy, err := d.Hasher.Hash("timing-equalisation-only")
	if err != nil {
		return nil, fmt.Errorf("identity: hash dummy password: %w", err)
	}
	return &Service{
		pool:         d.Pool,
		q:            identitydb.New(d.Pool),
		logger:       d.Logger,
		audit:        auditor{logger: d.Logger},
		catalogue:    d.Catalogue,
		hasher:       d.Hasher,
		tokens:       d.Tokens,
		now:          d.Now,
		registration: d.Registration,
		limits:       newLimits(d.Now),
		dummyHash:    dummy,
	}, nil
}

// limits are the in-memory rate limits of spec §6.2.
type limits struct {
	loginPerIP      *ratelimit.Limiter // every attempt
	loginPerEmail   *ratelimit.Limiter // failures only, unknown emails included
	registerPerIP   *ratelimit.Limiter
	reauthPerFamily *ratelimit.Limiter // failures only
	selectPerDevice *ratelimit.Limiter
}

func newLimits(now func() time.Time) limits {
	return limits{
		loginPerIP:      ratelimit.New(30*time.Second, 5, now),  // 10 / 5 min, burst 5
		loginPerEmail:   ratelimit.New(90*time.Second, 10, now), // 10 / 15 min
		registerPerIP:   ratelimit.New(20*time.Minute, 3, now),  // 3 / hour
		reauthPerFamily: ratelimit.New(3*time.Minute, 5, now),   // 5 / 15 min
		selectPerDevice: ratelimit.New(2*time.Second, 30, now),  // 30 / min
	}
}

// inTx runs fn in a transaction, committing only if fn succeeds.
func (s *Service) inTx(ctx context.Context, fn func(q *identitydb.Queries) error) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	if err := fn(s.q.WithTx(tx)); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
			return errors.Join(err, fmt.Errorf("rollback: %w", rbErr))
		}
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	return nil
}

// rateLimited logs the hit and returns the RetryError the HTTP layer turns
// into 429 rate_limited.
func (s *Service) rateLimited(ctx context.Context, limit string, wait time.Duration, attrs ...slog.Attr) error {
	s.audit.event(ctx, evRateLimited, append([]slog.Attr{slog.String("limit", limit)}, attrs...)...)
	return &RetryError{After: wait}
}

// verifyFamilyPassword is the re-authentication step of owner actions and of
// a PARENT resetting their own PIN: limited to 5 failures per family per
// 15 minutes, checked before bcrypt runs.
func (s *Service) verifyFamilyPassword(ctx context.Context, family identitydb.Family, password string) error {
	key := family.ID.String()
	if ok, wait := s.limits.reauthPerFamily.Check(key); !ok {
		return s.rateLimited(ctx, "reauth_per_family", wait, familyAttr(family.ID))
	}
	ok, err := s.hasher.Matches(family.PasswordHash, password)
	if err != nil {
		return fmt.Errorf("verify family password: %w", err)
	}
	if !ok {
		s.limits.reauthPerFamily.Fail(key)
		return ErrInvalidPassword
	}
	return nil
}
