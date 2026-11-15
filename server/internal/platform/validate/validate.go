package validate

import (
	"fmt"
	"net/mail"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/chris-abs/cadence/server/internal/models"
)

type Fields map[string]string

func (f Fields) Add(field, msg string) {
	if msg == "" {
		return
	}
	if _, ok := f[field]; !ok {
		f[field] = msg
	}
}

func (f Fields) Err() error {
	if len(f) == 0 {
		return nil
	}
	return &models.ValidationError{Fields: f}
}

const MaxEmailLength = 254

func Email(raw string) (string, string) {
	email := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case email == "":
		return "", "Enter an email address."
	case len(email) > MaxEmailLength:
		return "", "Use at most 254 characters."
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Name != "" || addr.Address != email {
		return "", "Enter a valid email address."
	}
	return email, ""
}

func Name(raw string, maxChars int) (string, string) {
	name := strings.TrimSpace(raw)
	switch n := utf8.RuneCountInString(name); {
	case n == 0:
		return "", "Enter a name."
	case n > maxChars:
		return "", fmt.Sprintf("Use at most %d characters.", maxChars)
	case strings.IndexFunc(name, unicode.IsControl) >= 0:
		return "", "Remove control characters."
	}
	return name, ""
}
