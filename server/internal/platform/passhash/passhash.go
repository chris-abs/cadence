package passhash

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const DefaultCost = 12

type Hasher interface {
	Hash(secret string) (string, error)
	Matches(hash, secret string) (bool, error)
}

type Bcrypt struct {
	cost int
}

func NewBcrypt(cost int) Bcrypt { return Bcrypt{cost: cost} }

func (b Bcrypt) Hash(secret string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(secret), b.cost)
	if err != nil {
		return "", fmt.Errorf("bcrypt hash: %w", err)
	}
	return string(h), nil
}

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
