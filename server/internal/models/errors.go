package models

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"
)

var (
	ErrFamilySessionRequired  = errors.New("family session required")
	ErrProfileSessionRequired = errors.New("profile session required")
	ErrInvalidCredentials     = errors.New("invalid credentials")
	ErrForbidden              = errors.New("forbidden")
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

type ValidationError struct {
	Fields map[string]string
}

func (e *ValidationError) Error() string {
	keys := make([]string, 0, len(e.Fields))
	for k := range e.Fields {
		keys = append(keys, k)
	}
	slices.Sort(keys)
	return "validation failed: " + strings.Join(keys, ", ")
}

func Invalid(field, msg string) error {
	return &ValidationError{Fields: map[string]string{field: msg}}
}

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
