// Package passhash hashes family passwords and profile PINs with bcrypt.
// Callers depend on the Hasher interface so tests can use a low cost and count
// calls; production always uses DefaultCost.
package passhash

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// DefaultCost is the production bcrypt cost (spec §4: cost 12).
const DefaultCost = 12

// Hasher hashes and verifies secrets. Matches returns (false, nil) for a wrong
// secret and an error only when the stored hash itself is unusable.
type Hasher interface {
	Hash(secret string) (string, error)
	Matches(hash, secret string) (bool, error)
}

// Bcrypt is a Hasher using bcrypt at a fixed cost.
type Bcrypt struct {
	cost int
}

// NewBcrypt returns a bcrypt Hasher. Use DefaultCost outside tests.
func NewBcrypt(cost int) Bcrypt { return Bcrypt{cost: cost} }

// Hash returns the bcrypt hash of secret. Secrets over 72 bytes are an error,
// never silently truncated; validation rejects them before this point.
func (b Bcrypt) Hash(secret string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(secret), b.cost)
	if err != nil {
		return "", fmt.Errorf("bcrypt hash: %w", err)
	}
	return string(h), nil
}

// Matches reports whether secret matches hash.
func (b Bcrypt) Matches(hash, secret string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(secret))
	switch {
	case err == nil:
		return true, nil
	case errors.Is(err, bcrypt.ErrMismatchedHashAndPassword):
		return false, nil
	default:
		return false, fmt.Errorf("bcrypt compare: %w", err)
	}
}
