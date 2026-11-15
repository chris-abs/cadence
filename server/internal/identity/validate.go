package identity

import (
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/chris-abs/cadence/server/internal/api"
)

// Input limits (spec §6.3).
const (
	maxEmailLength      = 254
	minPasswordChars    = 10
	maxPasswordChars    = 72
	maxPasswordBytes    = 72 // bcrypt's limit: reject, never truncate
	maxFamilyNameChars  = 60
	maxProfileNameChars = 40
	maxDeviceNameChars  = 60
	maxUserAgentChars   = 256
	maxProfiles         = 20
)

var (
	pinPattern    = regexp.MustCompile(`^[0-9]{6}$`)
	avatarPattern = regexp.MustCompile(`^[a-z0-9-]{1,32}$`)
)

// fieldErrors collects per-field messages; the first message for a field wins.
type fieldErrors map[string]string

func (f fieldErrors) add(field, msg string) {
	if msg == "" {
		return
	}
	if _, ok := f[field]; !ok {
		f[field] = msg
	}
}

func (f fieldErrors) err() error {
	if len(f) == 0 {
		return nil
	}
	return &ValidationError{Fields: f}
}

// normalizeEmail trims and lower-cases raw and checks it is a bare address.
func normalizeEmail(raw string) (string, string) {
	email := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case email == "":
		return "", "Enter an email address."
	case len(email) > maxEmailLength:
		return "", "Use at most 254 characters."
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Name != "" || addr.Address != email {
		return "", "Enter a valid email address."
	}
	return email, ""
}

// checkPassword enforces 10–72 characters and at most 72 bytes.
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

// checkPIN enforces exactly six ASCII digits.
func checkPIN(pin string) string {
	if !pinPattern.MatchString(pin) {
		return "Use exactly 6 digits."
	}
	return ""
}

// normalizeName trims raw and checks 1–max characters without control characters.
func normalizeName(raw string, max int) (string, string) {
	name := strings.TrimSpace(raw)
	switch n := utf8.RuneCountInString(name); {
	case n == 0:
		return "", "Enter a name."
	case n > max:
		return "", fmt.Sprintf("Use at most %d characters.", max)
	case strings.IndexFunc(name, unicode.IsControl) >= 0:
		return "", "Remove control characters."
	}
	return name, ""
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

// checkTimezone accepts IANA names only; "" and "Local" would silently mean
// the server's zone.
func checkTimezone(tz string) string {
	if tz == "" || tz == "Local" {
		return "Choose a time zone."
	}
	if _, err := time.LoadLocation(tz); err != nil {
		return "Choose a valid time zone."
	}
	return ""
}

// normalizeContactEmail validates an optional contact email; nil clears it,
// an empty string is an error (spec §6.3).
func normalizeContactEmail(raw *string) (*string, string) {
	if raw == nil {
		return nil, ""
	}
	email, msg := normalizeEmail(*raw)
	if msg != "" {
		return nil, msg
	}
	return &email, ""
}

// normalizeDeviceName trims an optional device label; blank means none.
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

// truncateUserAgent keeps at most 256 characters of a User-Agent header; it is
// informational, so it is shortened rather than rejected.
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
