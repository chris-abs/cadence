package family

import (
	"time"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/models"
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

func NormalizeName(raw string) (string, string) {
	return models.NormalizeName(raw, maxNameChars)
}

func checkAutoLock(minutes int) string {
	if minutes < 1 || minutes > 30 {
		return "Choose between 1 and 30 minutes."
	}
	return ""
}
