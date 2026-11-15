package family

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/validate"
)

const maxNameChars = 60

type Family struct {
	ID                uuid.UUID
	Name              string
	Email             string
	PasswordHash      string
	PasswordChangedAt time.Time
	AutoLockMinutes   int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type NewFamily struct {
	ID           uuid.UUID
	Name         string
	Email        string
	PasswordHash string
}

type ModuleState struct {
	Module  models.Module
	Enabled bool
}

type familyKey struct{}

func WithFamily(ctx context.Context, f Family) context.Context {
	return context.WithValue(ctx, familyKey{}, f)
}

func FromContext(ctx context.Context) (Family, bool) {
	f, ok := ctx.Value(familyKey{}).(Family)
	return f, ok
}

func NormaliseName(raw string) (string, string) {
	return validate.Name(raw, maxNameChars)
}

func checkAutoLock(minutes int) string {
	if minutes < 1 || minutes > 30 {
		return "Choose between 1 and 30 minutes."
	}
	return ""
}
