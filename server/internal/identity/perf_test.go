package identity_test

import (
	"context"
	"log/slog"
	"net/http"
	"regexp"
	"slices"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity"
	"github.com/chris-abs/cadence/server/internal/meals"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
)

var queryName = regexp.MustCompile(`-- name: (\w+)`)

// names reduces recorded SQL to sqlc query names.
func names(sqls []string) []string {
	out := make([]string, len(sqls))
	for i, q := range sqls {
		if m := queryName.FindStringSubmatch(q); m != nil {
			out[i] = m[1]
		} else {
			out[i] = q
		}
	}
	return out
}

// Budget 1: an authenticated request spends one query on session + profile +
// role + family and at most one on module state; handlers add only their own
// data, with no N+1. The clock stands still, so no renewal write happens.
func TestQueryBudgets(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Budget")
	for i := range 5 { // more profiles must not mean more queries
		f.owner.create("Extra "+string(rune('a'+i)), "CHILD")
	}

	tests := []struct {
		name string
		dev  *device
		path string
		want []string
	}{
		{"profile-session request", f.child.dev, "/modules", []string{"GetProfileSession", "ListFamilyModules"}},
		{"GET /me (child)", f.child.dev, "/me", []string{"GetProfileSession", "ListFamilyModules"}},
		{"GET /me (parent without PIN)", f.owner.dev, "/me", []string{"GetProfileSession", "ListFamilyModules", "FamilyHasChild"}},
		{"GET /family", f.owner.dev, "/family", []string{"GetProfileSession", "ListFamilyModules"}},
		{"GET /profiles", f.fsOnly, "/profiles", []string{"GetFamilySession", "ListProfiles"}},
		{"GET /auth/session", f.fsOnly, "/auth/session", []string{"GetFamilySession", "ListProfiles"}},
		{"GET /auth/sessions", f.owner.dev, "/auth/sessions", []string{"GetProfileSession", "ListFamilyModules", "ListDevices"}},
		{"GET /profiles/{id}", f.child.dev, "/profiles/" + f.owner.id, []string{"GetProfileSession", "ListFamilyModules", "GetProfile"}},
	}
	for _, tt := range tests {
		e.queries.Reset()
		wantStatus(t, tt.dev.do(http.MethodGet, tt.path, nil), http.StatusOK, "")
		if got := names(e.queries.Queries()); !slices.Equal(got, tt.want) {
			t.Errorf("%s ran %v, want %v", tt.name, got, tt.want)
		}
	}
}

// Budget 4: bcrypt runs only on login, password re-authentication and PIN
// entry, never on ordinary session-authenticated requests.
func TestNoHashingOnSessionRequests(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Fast")
	before := e.hasher.calls.Load()
	for _, r := range []struct {
		dev          *device
		method, path string
		body         any
	}{
		{f.owner.dev, http.MethodGet, "/me", nil},
		{f.owner.dev, http.MethodGet, "/family", nil},
		{f.owner.dev, http.MethodPut, "/family", map[string]any{"name": "Fast", "autoLockMinutes": 3}},
		{f.owner.dev, http.MethodGet, "/auth/sessions", nil},
		{f.owner.dev, http.MethodPut, "/modules/meals", map[string]any{"enabled": true}},
		{f.child.dev, http.MethodGet, "/profiles/" + f.owner.id, nil},
		{f.owner.dev, http.MethodPut, "/profiles/" + f.child.id + "/role", map[string]any{"role": "CHILD"}},
		{f.fsOnly, http.MethodGet, "/profiles", nil},
		{f.fsOnly, http.MethodPost, "/auth/profile-session", map[string]any{"profileId": f.parent.id}}, // no PIN set
	} {
		if rec := r.dev.do(r.method, r.path, r.body); rec.Code >= 400 {
			t.Fatalf("%s %s = %d %s", r.method, r.path, rec.Code, rec.Body)
		}
	}
	if n := e.hasher.calls.Load() - before; n != 0 {
		t.Errorf("%d hash calls on session requests, want 0", n)
	}
}

func newService(t testing.TB, e *env) *identity.Service {
	t.Helper()
	cat, err := authz.NewCatalogue(meals.Module)
	if err != nil {
		t.Fatal(err)
	}
	svc, err := identity.NewService(identity.Deps{
		Pool: e.pool, Logger: slog.New(slog.DiscardHandler), Catalogue: cat,
		Hasher: passhash.NewBcrypt(bcrypt.MinCost), Tokens: identity.NewTokenSource(nil),
		Now: e.clock.Now, Registration: identity.RegistrationOpen,
	})
	if err != nil {
		t.Fatal(err)
	}
	return svc
}

// Budget 7: the cleanup job sweeps expired sessions and stops promptly when
// its context is cancelled (main cancels it on shutdown).
func TestCleanupLifecycle(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Sweep")
	svc := newService(t, e)

	e.clock.Advance(31 * time.Minute) // every profile session idles out
	ctx, cancel := context.WithCancel(t.Context())
	done := make(chan struct{})
	go func() {
		svc.RunCleanup(ctx, 5*time.Millisecond)
		close(done)
	}()
	deadline := time.Now().Add(5 * time.Second)
	for count(t, e.pool, `SELECT count(*) FROM session WHERE kind = 'profile'`) != 0 {
		if time.Now().After(deadline) {
			t.Fatal("cleanup never removed the expired profile sessions")
		}
		time.Sleep(5 * time.Millisecond)
	}
	if n := len(e.sessions(f)); n != 4 {
		t.Errorf("%d family sessions left, want 4: live sessions must survive", n)
	}
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("cleanup did not stop after cancellation")
	}

	// The app-level entry point main uses also returns on cancellation.
	appCtx, appCancel := context.WithCancel(t.Context())
	appDone := make(chan struct{})
	go func() {
		e.h.RunCleanup(appCtx)
		close(appDone)
	}()
	appCancel()
	select {
	case <-appDone:
	case <-time.After(time.Second):
		t.Fatal("app RunCleanup did not stop after cancellation")
	}
}
