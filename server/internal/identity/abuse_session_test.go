package identity_test

import (
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

// sessions returns the ids of every session row of f's family.
func (e *env) sessions(f *family) []uuid.UUID {
	e.t.Helper()
	rows, err := e.pool.Query(e.t.Context(),
		`SELECT s.id FROM session s JOIN profile p ON p.family_id = s.family_id WHERE p.id = $1 ORDER BY s.id`, f.owner.id)
	if err != nil {
		e.t.Fatal(err)
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			e.t.Fatal(err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		e.t.Fatal(err)
	}
	return ids
}

func ids(devs ...uuid.UUID) []uuid.UUID {
	out := slices.Clone(devs)
	slices.SortFunc(out, func(a, b uuid.UUID) int { return strings.Compare(a.String(), b.String()) })
	return out
}

// Abuse 1 (R1): a token presented under the other cookie's name is refused
// on every session route, so the two kinds can never stand in for each other.
func TestTokenKindConfusion(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Conf")
	fs, ps := f.owner.dev.cookies[familyCookie], f.owner.dev.cookies[profileCookie]
	swapped := f.owner.dev.with(map[string]string{familyCookie: ps, profileCookie: fs})
	psAsFS := f.owner.dev.with(map[string]string{familyCookie: ps})

	for _, ep := range matrix() {
		if ep.auth == public {
			continue
		}
		method, path, _ := strings.Cut(ep.pattern, " ")
		path = strings.NewReplacer("{profileId}", f.owner.id, "{sessionId}", uuid.NewString(), "{moduleId}", "meals").Replace(path)
		for name, dev := range map[string]*device{"swapped": swapped, "PS token as FS": psAsFS} {
			rec := dev.do(method, path, nil)
			if rec.Code != http.StatusUnauthorized || !strings.Contains(rec.Body.String(), "family_session_required") {
				t.Errorf("%s %s with %s: %d %s", method, path, name, rec.Code, rec.Body)
			}
		}
	}
}

// Abuse 2: idle and absolute expiry of both kinds answer 401 with the right
// code and delete the expired row.
func TestSessionExpiry(t *testing.T) {
	t.Parallel()

	t.Run("profile idle", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Idle")
		e.clock.Advance(30 * time.Minute)
		wantStatus(t, f.owner.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
		if _, ok := f.owner.dev.cookies[profileCookie]; ok {
			t.Error("expired profile cookie must be cleared")
		}
		// The device itself is still signed in.
		wantStatus(t, f.owner.dev.do(http.MethodGet, "/profiles", nil), http.StatusOK, "")
	})

	t.Run("profile absolute despite activity", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Abs")
		for elapsed := time.Duration(0); elapsed < 12*time.Hour-29*time.Minute; elapsed += 29 * time.Minute {
			e.clock.Advance(29 * time.Minute)
			wantStatus(t, f.owner.dev.do(http.MethodGet, "/me", nil), http.StatusOK, "")
		}
		e.clock.Advance(29 * time.Minute)
		wantStatus(t, f.owner.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	})

	t.Run("family idle", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("FIdle")
		e.clock.Advance(30 * 24 * time.Hour)
		wantStatus(t, f.fsOnly.do(http.MethodGet, "/profiles", nil), http.StatusUnauthorized, "family_session_required")
		// A profile request on an expired device goes to login, not the picker.
		wantStatus(t, f.owner.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "family_session_required")
		// The two devices looked up are deleted on the spot (the owner's
		// profile session by cascade); the rest wait for the hourly sweep.
		if n := len(e.sessions(f)); n != 4 {
			t.Errorf("%d sessions left, want 4 (parent and child devices)", n)
		}
	})

	t.Run("family absolute despite activity", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("FAbs")
		for range 3 { // days 29, 58, 87: each renews the idle window
			e.clock.Advance(29 * 24 * time.Hour)
			wantStatus(t, f.fsOnly.do(http.MethodGet, "/profiles", nil), http.StatusOK, "")
		}
		e.clock.Advance(4 * 24 * time.Hour) // day 91
		wantStatus(t, f.fsOnly.do(http.MethodGet, "/profiles", nil), http.StatusUnauthorized, "family_session_required")
	})
}

func (e *env) idleExpiry(id uuid.UUID) time.Time {
	e.t.Helper()
	var at time.Time
	if err := e.pool.QueryRow(e.t.Context(), `SELECT idle_expires_at FROM session WHERE id = $1`, id).Scan(&at); err != nil {
		e.t.Fatal(err)
	}
	return at
}

// Abuse 3 and budget 5: passive requests never renew; active ones renew both
// the profile and its family session, at most once a minute each.
func TestSlidingRenewal(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Slide")
	dev := f.owner.dev
	fsID, psID := dev.sessionID(familyCookie), dev.sessionID(profileCookie)
	fsBefore, psBefore := e.idleExpiry(fsID), e.idleExpiry(psID)

	e.clock.Advance(2 * time.Minute)
	passive := dev.with(dev.cookies)
	passive.headers["X-Cadence-Passive"] = "1"
	wantStatus(t, passive.do(http.MethodGet, "/me", nil), http.StatusOK, "")
	if !e.idleExpiry(fsID).Equal(fsBefore) || !e.idleExpiry(psID).Equal(psBefore) {
		t.Fatal("a passive request moved idle_expires_at")
	}

	e.queries.Reset()
	wantStatus(t, dev.do(http.MethodGet, "/me", nil), http.StatusOK, "")
	if got := countMatching(e.queries.Queries(), "TouchSession"); got != 2 {
		t.Errorf("first active request after 2 min renewed %d sessions, want 2 (PS and its FS)", got)
	}
	psAfter := e.idleExpiry(psID)
	if !psAfter.Equal(e.clock.Now().Add(30 * time.Minute)) {
		t.Errorf("profile idle expiry = %s, want now + 30 min", psAfter)
	}

	// Within the minute: no writes, however many requests.
	e.clock.Advance(30 * time.Second)
	e.queries.Reset()
	for range 5 {
		wantStatus(t, dev.do(http.MethodGet, "/me", nil), http.StatusOK, "")
	}
	if got := countMatching(e.queries.Queries(), "TouchSession"); got != 0 {
		t.Errorf("%d renewal writes within one minute, want 0", got)
	}
}

func countMatching(queries []string, name string) int {
	n := 0
	for _, q := range queries {
		if strings.Contains(q, "name: "+name+" ") {
			n++
		}
	}
	return n
}

// Abuse 8 (R3): rights are read from the database on every request.
func TestRightsAreLive(t *testing.T) {
	t.Parallel()

	t.Run("demotion behind the session's back", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Live")
		wantStatus(t, f.parent.dev.do(http.MethodGet, "/family", nil), http.StatusOK, "")
		// Change the role directly, without the endpoint's session cleanup:
		// the same profile session must lose its rights on the next request.
		if _, err := e.pool.Exec(t.Context(), `UPDATE profile SET role = 'CHILD' WHERE id = $1`, f.parent.id); err != nil {
			t.Fatal(err)
		}
		wantStatus(t, f.parent.dev.do(http.MethodGet, "/family", nil), http.StatusForbidden, "forbidden")
	})

	t.Run("demotion through the endpoint", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Demote")
		wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.parent.id+"/role", map[string]any{"role": "CHILD"}), http.StatusOK, "")
		wantStatus(t, f.parent.dev.do(http.MethodGet, "/family", nil), http.StatusUnauthorized, "profile_session_required")
		wantStatus(t, f.parent.dev.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": f.parent.id}), http.StatusOK, "")
		wantStatus(t, f.parent.dev.do(http.MethodGet, "/family", nil), http.StatusForbidden, "forbidden")
	})

	t.Run("deleted profile", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Gone")
		wantStatus(t, f.owner.dev.do(http.MethodDelete, "/profiles/"+f.child.id, nil), http.StatusNoContent, "")
		wantStatus(t, f.child.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	})

	t.Run("disabled module", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Mods")
		if !hasPermission(t, f.child.dev, "meals.shopping.tick") {
			t.Fatal("child should tick shopping items while meals is on")
		}
		wantStatus(t, f.owner.dev.do(http.MethodPut, "/modules/meals", map[string]any{"enabled": false}), http.StatusOK, "")
		if hasPermission(t, f.child.dev, "meals.shopping.tick") {
			t.Error("a disabled module's rights must vanish on the next request")
		}
	})
}

// Abuse 10: each invalidating event deletes exactly the sessions in §3's table.
func TestSessionInvalidation(t *testing.T) {
	t.Parallel()

	t.Run("password change keeps only this device", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Pw")
		keep := ids(f.owner.dev.sessionID(familyCookie), f.owner.dev.sessionID(profileCookie))
		wantStatus(t, f.owner.dev.do(http.MethodPut, "/family/password",
			map[string]any{"currentPassword": testPassword, "newPassword": "a brand new password"}), http.StatusNoContent, "")
		if got := e.sessions(f); !slices.Equal(got, keep) {
			t.Errorf("sessions = %v, want %v", got, keep)
		}
		wantStatus(t, f.parent.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "family_session_required")
	})

	t.Run("pin reset signs out the target only", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("PinReset")
		before := e.sessions(f)
		childPS := f.child.dev.sessionID(profileCookie)
		wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id+"/pin", map[string]any{"pin": "246810"}), http.StatusNoContent, "")
		want := slices.DeleteFunc(slices.Clone(before), func(id uuid.UUID) bool { return id == childPS })
		if got := e.sessions(f); !slices.Equal(got, want) {
			t.Errorf("sessions = %v, want %v", got, want)
		}
	})

	t.Run("own pin change keeps the current profile session", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("PinSelf")
		second := e.join(f, f.parent.id) // the parent on a second device
		otherPS := second.dev.sessionID(profileCookie)
		before := e.sessions(f)
		wantStatus(t, f.parent.dev.do(http.MethodPut, "/profiles/"+f.parent.id+"/pin", map[string]any{"pin": "135790"}), http.StatusNoContent, "")
		want := slices.DeleteFunc(slices.Clone(before), func(id uuid.UUID) bool { return id == otherPS })
		if got := e.sessions(f); !slices.Equal(got, want) {
			t.Errorf("sessions = %v, want %v", got, want)
		}
		wantStatus(t, f.parent.dev.do(http.MethodGet, "/me", nil), http.StatusOK, "")
	})

	t.Run("role change signs out the target only", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Role")
		childPS := f.child.dev.sessionID(profileCookie)
		before := e.sessions(f)
		wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id+"/role", map[string]any{"role": "PARENT"}), http.StatusOK, "")
		want := slices.DeleteFunc(slices.Clone(before), func(id uuid.UUID) bool { return id == childPS })
		if got := e.sessions(f); !slices.Equal(got, want) {
			t.Errorf("sessions = %v, want %v", got, want)
		}
		wantStatus(t, f.child.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	})

	t.Run("revoke device and revoke others", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		f := e.newFamily("Rev")
		childFS := f.child.dev.sessionID(familyCookie)
		wantStatus(t, f.owner.dev.do(http.MethodDelete, "/auth/sessions/"+childFS.String(), nil), http.StatusNoContent, "")
		wantStatus(t, f.child.dev.do(http.MethodGet, "/profiles", nil), http.StatusUnauthorized, "family_session_required")

		ownerFS := f.owner.dev.sessionID(familyCookie)
		keep := ids(ownerFS, f.owner.dev.sessionID(profileCookie))
		wantStatus(t, f.owner.dev.do(http.MethodPost, "/auth/sessions/revoke-others", nil), http.StatusNoContent, "")
		if got := e.sessions(f); !slices.Equal(got, keep) {
			t.Errorf("sessions = %v, want %v", got, keep)
		}
		// Revoking the current device clears this device's cookies.
		wantStatus(t, f.owner.dev.do(http.MethodDelete, "/auth/sessions/"+ownerFS.String(), nil), http.StatusNoContent, "")
		if len(f.owner.dev.cookies) != 0 {
			t.Errorf("cookies left after revoking this device: %v", f.owner.dev.cookies)
		}
		if n := len(e.sessions(f)); n != 0 {
			t.Errorf("%d sessions left", n)
		}
	})
}

func hasPermission(t *testing.T, d *device, perm string) bool {
	t.Helper()
	rec := d.do(http.MethodGet, "/me", nil)
	wantStatus(t, rec, http.StatusOK, "")
	return strings.Contains(rec.Body.String(), `"`+perm+`"`)
}
