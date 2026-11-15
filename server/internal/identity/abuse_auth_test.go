package identity_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/chris-abs/cadence/server/internal/api"
)

// Abuse 11 (§6.3): unknown email and wrong password are indistinguishable:
// same status, code and body, no cookie, and one bcrypt comparison each.
func TestLoginFailuresAreIdentical(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Same")

	attempt := func(email, password string) (int, string, int64, int) {
		d := e.device()
		before := e.hasher.calls.Load()
		rec := d.do(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": password})
		return rec.Code, rec.Body.String(), e.hasher.calls.Load() - before, len(rec.Header().Values("Set-Cookie"))
	}
	s1, b1, h1, c1 := attempt("nobody@example.com", testPassword)
	s2, b2, h2, c2 := attempt(f.email, "the wrong password")
	if s1 != http.StatusUnauthorized || s1 != s2 || b1 != b2 {
		t.Errorf("unknown email: %d %s; wrong password: %d %s", s1, b1, s2, b2)
	}
	if !strings.Contains(b1, "invalid_credentials") {
		t.Errorf("body = %s", b1)
	}
	if h1 != 1 || h2 != 1 {
		t.Errorf("bcrypt calls: unknown email %d, wrong password %d; want 1 each", h1, h2)
	}
	if c1 != 0 || c2 != 0 {
		t.Error("a failed login must not set cookies")
	}
	logs := e.logs.String()
	if !strings.Contains(logs, "reason=unknown_email") || !strings.Contains(logs, "reason=bad_password") {
		t.Error("login_failed must be audited with its reason")
	}
}

// Abuse 12: every limit in §6.2 answers 429 rate_limited with Retry-After.
func TestRateLimits(t *testing.T) {
	t.Parallel()
	wantLimited := func(t *testing.T, rec *httptest.ResponseRecorder) {
		t.Helper()
		if rec.Code != http.StatusTooManyRequests || rec.Header().Get("Retry-After") == "" {
			t.Fatalf("want 429 with Retry-After, got %d %v", rec.Code, rec.Header())
		}
	}

	t.Run("login per IP", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f, _ := e.register("IP")
		d := e.device()
		login := func() int {
			return d.do(http.MethodPost, "/auth/login", map[string]any{"email": f.email, "password": testPassword}).Code
		}
		for range 5 {
			if login() != http.StatusOK {
				t.Fatal("burst of 5 refused")
			}
		}
		rec := d.do(http.MethodPost, "/auth/login", map[string]any{"email": f.email, "password": testPassword})
		wantLimited(t, rec)
		wantStatus(t, rec, http.StatusTooManyRequests, "rate_limited")
		e.clock.Advance(30 * time.Second)
		if login() != http.StatusOK {
			t.Error("one attempt is back after 30s")
		}
	})

	t.Run("login per email counts failures, unknown emails too", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f, _ := e.register("Email")
		for _, email := range []string{f.email, "ghost@example.com"} {
			for range 10 {
				wantStatus(t, e.device().do(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": "nope nope nope"}),
					http.StatusUnauthorized, "invalid_credentials")
			}
			// Even the right password from a fresh IP is refused now.
			rec := e.device().do(http.MethodPost, "/auth/login", map[string]any{"email": strings.ToUpper(email), "password": testPassword})
			wantLimited(t, rec)
		}
	})

	t.Run("register per IP", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		d := e.device()
		for range 3 {
			d.do(http.MethodPost, "/auth/register", map[string]any{"email": "x"})
		}
		wantLimited(t, d.do(http.MethodPost, "/auth/register", map[string]any{"email": "x"}))
	})

	t.Run("password re-auth per family", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f, _ := e.register("Reauth")
		for range 5 {
			wantStatus(t, f.owner.dev.do(http.MethodPut, "/family/email", map[string]any{"email": "n@example.com", "password": "wrong wrong"}),
				http.StatusForbidden, "invalid_password")
		}
		wantLimited(t, f.owner.dev.do(http.MethodPut, "/family/email", map[string]any{"email": "n@example.com", "password": testPassword}))
		// The limit is per family, across endpoints.
		wantLimited(t, f.owner.dev.do(http.MethodPost, "/family/delete", map[string]any{"password": testPassword, "confirmName": "Reauth"}))
	})

	t.Run("profile select per device", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f, _ := e.register("Select")
		for range 30 {
			wantStatus(t, f.owner.dev.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": f.owner.id}), http.StatusOK, "")
		}
		wantLimited(t, f.owner.dev.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": f.owner.id}))
	})

	t.Run("concurrent first registrations", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t, withRegistration("first"))
		devs := []*device{e.device(), e.device(), e.device(), e.device()}
		codes := make([]int, len(devs))
		var wg sync.WaitGroup
		for i, d := range devs {
			wg.Go(func() {
				codes[i] = d.do(http.MethodPost, "/auth/register", map[string]any{
					"email": "first" + string(rune('a'+i)) + "@example.com", "password": testPassword, "familyName": "F",
					"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "UTC"},
				}).Code
			})
		}
		wg.Wait()
		created := 0
		for _, c := range codes {
			switch c {
			case http.StatusCreated:
				created++
			case http.StatusForbidden:
			default:
				t.Errorf("unexpected status %d", c)
			}
		}
		if created != 1 {
			t.Errorf("codes %v: %d families created, want exactly 1", codes, created)
		}
	})
}

// Abuse 14: deleting the family needs the password and the name; success
// removes every row the family owns and signs every device out.
func TestDeleteFamily(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	a, b := e.newFamily("Doomed"), e.newFamily("Bystander")
	wantStatus(t, a.owner.dev.do(http.MethodPut, "/modules/meals", map[string]any{"enabled": false}), http.StatusOK, "")
	wantStatus(t, a.owner.dev.do(http.MethodPut, "/profiles/"+a.child.id+"/pin", map[string]any{"pin": "111111"}), http.StatusNoContent, "")
	selectWithPIN(a.fsOnly, a.child.id, "000000") // leaves a pin_attempt row

	familyID := decode[api.Me](t, a.owner.dev.do(http.MethodGet, "/me", nil)).Family.Id
	counts := func() map[string]int {
		out := map[string]int{}
		for table, q := range map[string]string{
			"family":        `SELECT count(*) FROM family WHERE id = $1`,
			"profile":       `SELECT count(*) FROM profile WHERE family_id = $1`,
			"session":       `SELECT count(*) FROM session WHERE family_id = $1`,
			"family_module": `SELECT count(*) FROM family_module WHERE family_id = $1`,
			"pin_attempt":   `SELECT count(*) FROM pin_attempt WHERE profile_id = ANY(SELECT id FROM profile WHERE family_id = $1)`,
		} {
			out[table] = count(t, e.pool, q, familyID)
		}
		return out
	}
	before := counts()
	for table, n := range before {
		if n == 0 {
			t.Fatalf("fixture has no %s rows; the test would prove nothing", table)
		}
	}

	wantStatus(t, a.owner.dev.do(http.MethodPost, "/family/delete", map[string]any{"password": "not the password", "confirmName": "Doomed"}),
		http.StatusForbidden, "invalid_password")
	wantStatus(t, a.owner.dev.do(http.MethodPost, "/family/delete", map[string]any{"password": testPassword, "confirmName": "Doomd"}),
		http.StatusUnprocessableEntity, "validation_failed")
	if got := counts(); got["profile"] != before["profile"] || got["family"] != 1 {
		t.Fatalf("a refused delete changed data: %v", got)
	}

	rec := a.owner.dev.do(http.MethodPost, "/family/delete", map[string]any{"password": testPassword, "confirmName": "  doomed "})
	wantStatus(t, rec, http.StatusNoContent, "")
	if len(a.owner.dev.cookies) != 0 {
		t.Error("both cookies must be cleared on this device")
	}
	for table, n := range counts() {
		if n != 0 {
			t.Errorf("%d %s rows left", n, table)
		}
	}
	wantStatus(t, a.parent.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "family_session_required")
	wantStatus(t, b.owner.dev.do(http.MethodGet, "/me", nil), http.StatusOK, "")
}

// Abuse 17: a password over 72 bytes is rejected, never truncated.
func TestPasswordByteLimit(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	long := strings.Repeat("é", 37) // 37 characters, 74 bytes
	rec := e.device().do(http.MethodPost, "/auth/register", map[string]any{
		"email": "long@example.com", "password": long, "familyName": "L",
		"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "UTC"},
	})
	wantStatus(t, rec, http.StatusUnprocessableEntity, "")
	if got := decode[api.Error](t, rec); got.Error.Fields == nil || !strings.Contains((*got.Error.Fields)["password"], "bytes") {
		t.Errorf("error = %+v", got.Error)
	}

	f, _ := e.register("Change")
	rec = f.owner.dev.do(http.MethodPut, "/family/password", map[string]any{"currentPassword": testPassword, "newPassword": long})
	wantStatus(t, rec, http.StatusUnprocessableEntity, "validation_failed")
	// The 72-byte prefix of a too-long password must not work either.
	wantStatus(t, e.device().do(http.MethodPost, "/auth/login", map[string]any{"email": f.email, "password": long[:72]}),
		http.StatusUnauthorized, "invalid_credentials")
}

// Ownership transfer: the new owner gets the account rights, the old loses
// them, and nobody is signed out.
func TestTransferOwnership(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Crown")
	before := e.sessions(f)
	wantStatus(t, f.owner.dev.do(http.MethodPost, "/family/owner", map[string]any{"profileId": f.parent.id, "password": testPassword}),
		http.StatusNoContent, "")
	if !hasPermission(t, f.parent.dev, "family.account.manage") || hasPermission(t, f.owner.dev, "family.account.manage") {
		t.Error("account rights must move with ownership")
	}
	if got := e.sessions(f); len(got) != len(before) {
		t.Errorf("transfer changed sessions: %d -> %d", len(before), len(got))
	}
	// The old owner is now an ordinary PARENT and may be removed.
	wantStatus(t, f.parent.dev.do(http.MethodDelete, "/profiles/"+f.owner.id, nil), http.StatusNoContent, "")
}
