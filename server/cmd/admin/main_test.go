package main

import (
	"bytes"
	"errors"
	"log/slog"
	"regexp"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/auth"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

func TestResetPassword(t *testing.T) {
	t.Parallel()
	pool := testutil.NewDB(t)
	hasher := passhash.NewBcrypt(bcrypt.MinCost)
	svc, err := app.NewAuthService(app.Deps{
		Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvTest,
		Registration: auth.RegistrationOpen, Now: testutil.NewClock().Now, Hasher: hasher,
	})
	if err != nil {
		t.Fatal(err)
	}
	ctx := t.Context()
	if _, err := svc.Register(ctx, auth.RegisterInput{
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
	var hash string
	if err := pool.QueryRow(ctx, `SELECT password_hash FROM family`).Scan(&hash); err != nil {
		t.Fatal(err)
	}
	if ok, err := hasher.Matches(hash, m[1]); err != nil || !ok {
		t.Errorf("printed password is not the stored one (%v)", err)
	}
	if err := resetPassword(ctx, svc, "nobody@example.com", &out); !errors.Is(err, auth.ErrUnknownFamily) {
		t.Errorf("unknown email: %v", err)
	}
}
