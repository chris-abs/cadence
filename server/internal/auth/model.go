package auth

import (
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/family"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/profile"
)

type RegistrationMode string

const (
	RegistrationFirst  RegistrationMode = "first"
	RegistrationOpen   RegistrationMode = "open"
	RegistrationClosed RegistrationMode = "closed"
)

func (m RegistrationMode) Valid() bool {
	return m == RegistrationFirst || m == RegistrationOpen || m == RegistrationClosed
}

const (
	FamilyIdleTimeout      = 30 * 24 * time.Hour
	FamilyAbsoluteTimeout  = 90 * 24 * time.Hour
	ProfileIdleTimeout     = 30 * time.Minute
	ProfileAbsoluteTimeout = 12 * time.Hour
	CleanupInterval        = time.Hour

	renewEvery          = time.Minute
	tokenBytes          = 32
	registrationLockKey = 0x63616465
	minPasswordChars    = 10
	maxPasswordChars    = 72
	maxPasswordBytes    = 72
	maxDeviceNameChars  = 60
	maxUserAgentChars   = 256

	kindFamily  = "family"
	kindProfile = "profile"
)

type RegisterInput struct {
	Email, Password, FamilyName             string
	OwnerName, OwnerColour, OwnerTimezone   string
	OwnerAvatar, DeviceName                 *string
	UserAgent, ClientIP, CurrentDeviceToken string
}

type LoginInput struct {
	Email, Password                         string
	DeviceName                              *string
	UserAgent, ClientIP, CurrentDeviceToken string
}

type SignedIn struct {
	FamilyToken  string
	ProfileToken string
	Caller       models.Caller
}

type LoggedIn struct {
	Token    string
	Family   family.Family
	Profiles []profile.Profile
}

type Me struct {
	Caller     models.Caller
	Profile    profile.Profile
	Family     family.Family
	PinAdvised bool
}

type Device struct {
	ID                uuid.UUID
	DeviceName        *string
	UserAgent         *string
	CreatedAt         time.Time
	LastSeenAt        time.Time
	ActiveProfileID   *uuid.UUID
	ActiveProfileName *string
	Current           bool
}

type window struct {
	id                       uuid.UUID
	lastSeen, idle, absolute time.Time
}

func (w window) expired(now time.Time) bool { return !now.Before(w.idle) || !now.Before(w.absolute) }

func checkPassword(p string) string {
	n := utf8.RuneCountInString(p)
	switch {
	case n < minPasswordChars:
		return "Use at least 10 characters."
	case n > maxPasswordChars:
		return "Use at most 72 characters."
	case len(p) > maxPasswordBytes:
		return "Use at most 72 bytes; some characters count as more than one."
	}
	return ""
}

func normalizeDeviceName(raw *string) (*string, string) {
	if raw == nil {
		return nil, ""
	}
	name := strings.TrimSpace(*raw)
	switch {
	case name == "":
		return nil, ""
	case utf8.RuneCountInString(name) > maxDeviceNameChars:
		return nil, "Use at most 60 characters."
	case strings.IndexFunc(name, unicode.IsControl) >= 0:
		return nil, "Remove control characters."
	}
	return &name, ""
}

func truncateUserAgent(ua string) *string {
	ua = strings.ToValidUTF8(strings.TrimSpace(ua), "")
	if ua == "" {
		return nil
	}
	if utf8.RuneCountInString(ua) > maxUserAgentChars {
		ua = string([]rune(ua)[:maxUserAgentChars])
	}
	return &ua
}
