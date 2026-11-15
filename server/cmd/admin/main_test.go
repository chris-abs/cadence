package main

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"regexp"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/identity"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

func TestParseResetArgs(t *testing.T) {
	t.Parallel()
	if got, err := parseResetArgs([]string{"-email", "a@example.com"}, &bytes.Buffer{}); err != nil || got != "a@example.com" {
		t.Errorf("got %q, %v", got, err)
	}
	for _, args := range [][]string{{}, {"-email"}, {"-email", "a@example.com", "extra"}, {"-nope"}} {
		if _, err := parseResetArgs(args, &bytes.Buffer{}); err == nil {
			t.Errorf("%v: want a usage error", args)
		}
	}
	if err := run(t.Context(), []string{"drop-tables"}, &bytes.Buffer{}, &bytes.Buffer{}, func(string) string { return "" }); err == nil {
		t.Error("unknown command must fail")
	}
}

// TestResetPassword runs the command's logic against a real database: the
// new password works, the old one does not, and every device is signed out.
func TestResetPassword(t *testing.T) {
	t.Parallel()
	pool := testutil.NewDB(t)
	clock := testutil.NewClock()
	svc, err := app.NewIdentityService(app.Deps{
		Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvTest,
		Registration: identity.RegistrationOpen, Now: clock.Now, Hasher: passhash.NewBcrypt(bcrypt.MinCost),
	})
	if err != nil {
		t.Fatal(err)
	}
	ctx := t.Context()
	if _, err := svc.Register(ctx, identity.RegisterInput{
		Email: "owner@example.com", Password: "old password 123", FamilyName: "F",
		OwnerName: "O", OwnerColour: "teal", OwnerTimezone: "UTC", ClientIP: "10.0.0.1",
	}); err != nil {
		t.Fatal(err)
	}

	var out bytes.Buffer
	if err := resetPassword(ctx, svc, " Owner@Example.com ", &out); err != nil {
		t.Fatalf("resetPassword: %v", err)
	}
	m := regexp.MustCompile(`New family password: (\S+)`).FindStringSubmatch(out.String())
	if m == nil {
		t.Fatalf("output %q has no password", out.String())
	}
	var sessions int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM session`).Scan(&sessions); err != nil || sessions != 0 {
		t.Errorf("sessions after reset = %d (%v), want 0", sessions, err)
	}
	if _, err := svc.Login(ctx, identity.LoginInput{Email: "owner@example.com", Password: m[1], ClientIP: "10.0.0.2"}); err != nil {
		t.Errorf("login with the new password: %v", err)
	}
	if _, err := svc.Login(ctx, identity.LoginInput{Email: "owner@example.com", Password: "old password 123", ClientIP: "10.0.0.3"}); !errors.Is(err, identity.ErrInvalidCredentials) {
		t.Errorf("old password: %v", err)
	}

	if err := resetPassword(ctx, svc, "nobody@example.com", &out); !errors.Is(err, identity.ErrUnknownFamily) {
		t.Errorf("unknown email: %v", err)
	}
}

type failingResetter struct{}

func (failingResetter) ResetPassword(context.Context, string) (string, error) {
	return "", errors.New("db down")
}

func TestResetPasswordReportsFailure(t *testing.T) {
	t.Parallel()
	var out bytes.Buffer
	if err := resetPassword(t.Context(), failingResetter{}, "a@example.com", &out); err == nil || !strings.Contains(err.Error(), "db down") {
		t.Errorf("err = %v", err)
	}
	if out.Len() != 0 {
		t.Errorf("printed %q on failure", out.String())
	}
}
