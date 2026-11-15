package profile

import (
	"regexp"
	"time"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/validate"
)

const (
	maxNameChars = 40
	maxProfiles  = 20
)

var (
	pinPattern    = regexp.MustCompile(`^[0-9]{6}$`)
	avatarPattern = regexp.MustCompile(`^[a-z0-9-]{1,32}$`)
)

type Profile struct {
	ID                     uuid.UUID
	FamilyID               uuid.UUID
	Name                   string
	Role                   models.Role
	IsOwner                bool
	Colour                 string
	Avatar                 *string
	Timezone               string
	ContactEmail           *string
	ContactEmailVerifiedAt *time.Time
	CreatedAt              time.Time
	UpdatedAt              time.Time
	LockedUntil            *time.Time
	LockedFor              time.Duration
	pinHash                *string
}

func (p Profile) HasPin() bool { return p.pinHash != nil }

type NewProfile struct {
	ID           uuid.UUID
	FamilyID     uuid.UUID
	Name         string
	Role         models.Role
	IsOwner      bool
	Colour       string
	Avatar       *string
	Timezone     string
	PinHash      *string
	ContactEmail *string
}

type Input struct {
	Name         string
	Colour       string
	Avatar       *string
	Timezone     *string
	ContactEmail *string
	Role         string
	Pin          *string
}

type PINInput struct {
	Pin        *string
	CurrentPin *string
	Password   *string
}

func ValidateDisplay(fe validate.Fields, prefix, name, colour string, avatar *string, timezone string) string {
	name, msg := validate.Name(name, maxNameChars)
	fe.Add(prefix+"name", msg)
	fe.Add(prefix+"colour", checkColour(colour))
	fe.Add(prefix+"avatar", checkAvatar(avatar))
	fe.Add(prefix+"timezone", checkTimezone(timezone))
	return name
}

func checkPIN(pin string) string {
	if !pinPattern.MatchString(pin) {
		return "Use exactly 6 digits."
	}
	return ""
}

func checkColour(c string) string {
	if !api.ProfileColour(c).Valid() {
		return "Choose one of the listed colours."
	}
	return ""
}

func checkRole(r string) string {
	if !api.Role(r).Valid() {
		return "Choose PARENT or CHILD."
	}
	return ""
}

func checkAvatar(a *string) string {
	if a != nil && !avatarPattern.MatchString(*a) {
		return "Choose one of the built-in avatars."
	}
	return ""
}

func checkTimezone(tz string) string {
	if tz == "" || tz == "Local" {
		return "Choose a time zone."
	}
	if _, err := time.LoadLocation(tz); err != nil {
		return "Choose a valid time zone."
	}
	return ""
}

func normalizeContactEmail(raw *string) (*string, string) {
	if raw == nil {
		return nil, ""
	}
	email, msg := validate.Email(*raw)
	if msg != "" {
		return nil, msg
	}
	return &email, ""
}

func lockoutAfter(failures int32) time.Duration {
	switch {
	case failures < 5:
		return 0
	case failures == 5:
		return 30 * time.Second
	case failures == 6:
		return time.Minute
	case failures == 7:
		return 5 * time.Minute
	case failures == 8:
		return 15 * time.Minute
	default:
		return time.Hour
	}
}

func activeLock(until *time.Time, now time.Time) *time.Time {
	if until == nil || !now.Before(*until) {
		return nil
	}
	return until
}
