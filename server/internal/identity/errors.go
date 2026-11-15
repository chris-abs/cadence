package identity

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/chris-abs/cadence/server/internal/authz"
)

// Domain errors. The HTTP layer maps each to one status and stable code
// (spec §7); anything else is a 500 whose cause is only logged.
var (
	ErrFamilySessionRequired  = errors.New("family session required")
	ErrProfileSessionRequired = errors.New("profile session required")
	ErrInvalidCredentials     = errors.New("invalid credentials")
	ErrForbidden              = authz.ErrForbidden
	ErrInvalidPIN             = errors.New("invalid pin")
	ErrInvalidPassword        = errors.New("invalid password")
	ErrRegistrationClosed     = errors.New("registration closed")
	ErrNotFound               = errors.New("not found")
	ErrEmailTaken             = errors.New("email taken")
	ErrNameTaken              = errors.New("profile name taken")
	ErrOwnerProtected         = errors.New("owner protected")
	ErrSelfNotAllowed         = errors.New("not allowed on yourself")
	ErrProfileLimitReached    = errors.New("profile limit reached")
)

// ValidationError carries per-field messages safe to show to users.
type ValidationError struct {
	Fields map[string]string
}

func (e *ValidationError) Error() string {
	keys := make([]string, 0, len(e.Fields))
	for k := range e.Fields {
		keys = append(keys, k)
	}
	return "validation failed: " + strings.Join(keys, ", ")
}

// RetryError means "not now": a rate limit (Locked false) or a PIN lockout
// (Locked true). After is how long until a retry can succeed.
type RetryError struct {
	Locked bool
	After  time.Duration
}

func (e *RetryError) Error() string {
	if e.Locked {
		return fmt.Sprintf("pin locked for %s", e.After)
	}
	return fmt.Sprintf("rate limited for %s", e.After)
}

// Constraint names from the identity migration that map to user-facing
// conflicts rather than bugs.
const (
	constraintFamilyEmail = "family_email_key"
	constraintProfileName = "profile_family_name"
)

// uniqueViolation reports whether err is a unique violation of constraint.
func uniqueViolation(err error, constraint string) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == constraint
}

// notFound turns pgx's no-rows into ErrNotFound and wraps anything else.
func notFound(err error, what string) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return fmt.Errorf("%s: %w", what, err)
}
