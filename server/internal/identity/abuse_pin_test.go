package identity_test

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/chris-abs/cadence/server/internal/api"
)

func (e *env) pinFailures(profileID string) int {
	e.t.Helper()
	var n int
	if err := e.pool.QueryRow(e.t.Context(), `SELECT coalesce((SELECT failed_count FROM pin_attempt WHERE profile_id = $1), 0)`, profileID).Scan(&n); err != nil {
		e.t.Fatal(err)
	}
	return n
}

func selectWithPIN(d *device, id, pin string) *httptest.ResponseRecorder {
	return d.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": id, "pin": pin})
}

func wantLocked(t *testing.T, rec *httptest.ResponseRecorder, seconds int) {
	t.Helper()
	wantStatus(t, rec, http.StatusTooManyRequests, "")
	got := decode[api.Error](t, rec)
	if got.Error.Code != "pin_locked" || got.Error.RetryAfterSeconds == nil || *got.Error.RetryAfterSeconds != seconds {
		t.Fatalf("error = %+v, want pin_locked for %ds", got.Error, seconds)
	}
	if rec.Header().Get("Retry-After") != strconv.Itoa(seconds) {
		t.Fatalf("Retry-After = %q, want %d", rec.Header().Get("Retry-After"), seconds)
	}
}

// Abuse 9: the lockout schedule, checked before bcrypt, Retry-After, and a
// picker that shows the lock.
func TestPINLockoutSchedule(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Pins")
	wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id+"/pin", map[string]any{"pin": "111111"}), http.StatusNoContent, "")
	d := f.fsOnly

	wantStatus(t, d.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": f.child.id}), http.StatusUnprocessableEntity, "validation_failed")
	for range 4 {
		wantStatus(t, selectWithPIN(d, f.child.id, "999999"), http.StatusForbidden, "invalid_pin")
	}
	wantLocked(t, selectWithPIN(d, f.child.id, "999999"), 30) // 5th failure locks

	// While locked, even the right PIN is refused, and bcrypt never runs.
	calls := e.hasher.calls.Load()
	wantLocked(t, selectWithPIN(d, f.child.id, "111111"), 30)
	if e.hasher.calls.Load() != calls {
		t.Error("the lockout must be checked before bcrypt")
	}
	// The picker shows the lock both as an instant and as seconds left at
	// response time, so a device with a wrong clock still counts down right.
	e.clock.Advance(10*time.Second + 500*time.Millisecond)
	picker := decode[api.ProfileList](t, d.do(http.MethodGet, "/profiles", nil))
	for _, p := range picker.Profiles {
		switch {
		case p.Id != f.child.id:
			if p.LockedUntil != nil || p.LockedForSeconds != nil {
				t.Errorf("%s shows a lock it does not have", p.Name)
			}
		case p.LockedUntil == nil || !p.LockedUntil.Equal(e.clock.Now().Add(19*time.Second+500*time.Millisecond)):
			t.Errorf("picker lockedUntil = %v", p.LockedUntil)
		case p.LockedForSeconds == nil || *p.LockedForSeconds != 20:
			t.Errorf("picker lockedForSeconds = %v, want 20 (19.5 s rounded up)", p.LockedForSeconds)
		}
	}
	e.clock.Advance(-10*time.Second - 500*time.Millisecond) // back to the lock instant for the schedule below

	for _, step := range []struct{ wait, next int }{{30, 60}, {60, 300}, {300, 900}, {900, 3600}, {3600, 3600}} {
		e.clock.Advance(time.Duration(step.wait) * time.Second)
		wantLocked(t, selectWithPIN(d, f.child.id, "999999"), step.next)
	}
	e.clock.Advance(time.Hour)
	wantStatus(t, selectWithPIN(d, f.child.id, "111111"), http.StatusOK, "")
	if n := e.pinFailures(f.child.id); n != 0 {
		t.Errorf("a correct PIN must clear the failures, %d left", n)
	}
}

// Abuse 9: parallel wrong guesses are each counted exactly once.
func TestPINParallelGuesses(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Race")
	wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id+"/pin", map[string]any{"pin": "111111"}), http.StatusNoContent, "")
	devs := make([]*device, 8)
	for i := range devs {
		devs[i] = e.login(f)
	}

	statuses := make([]int, len(devs))
	var wg sync.WaitGroup
	for i, d := range devs {
		wg.Go(func() { statuses[i] = selectWithPIN(d, f.child.id, "999999").Code })
	}
	wg.Wait()

	var wrong, locked int
	for _, s := range statuses {
		switch s {
		case http.StatusForbidden:
			wrong++
		case http.StatusTooManyRequests:
			locked++
		}
	}
	// Serialised on the profile row: four free failures, the fifth locks,
	// the remaining three are refused unread.
	if wrong != 4 || locked != 4 {
		t.Errorf("statuses %v: %d wrong, %d locked; want 4 and 4", statuses, wrong, locked)
	}
	if n := e.pinFailures(f.child.id); n != 5 {
		t.Errorf("failed_count = %d, want 5", n)
	}
}

// Abuse 9: a parent reset clears the lockout; the lockout survives a restart.
func TestPINResetAndRestart(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Reset")
	wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id+"/pin", map[string]any{"pin": "111111"}), http.StatusNoContent, "")
	for range 5 {
		selectWithPIN(f.fsOnly, f.child.id, "999999")
	}

	// A new server process on the same database still refuses.
	restarted := f.fsOnly.with(f.fsOnly.cookies)
	restarted.h = e.handler()
	wantLocked(t, selectWithPIN(restarted, f.child.id, "111111"), 30)

	wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id+"/pin", map[string]any{"pin": "222222"}), http.StatusNoContent, "")
	if n := e.pinFailures(f.child.id); n != 0 {
		t.Errorf("reset left %d failures", n)
	}
	wantStatus(t, selectWithPIN(f.fsOnly, f.child.id, "222222"), http.StatusOK, "")
}

// The PIN proof table (spec §2) for one's own existing PIN.
func TestOwnPINProof(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Proof")
	pinPath := func(m member) string { return "/profiles/" + m.id + "/pin" }
	wantStatus(t, f.child.dev.do(http.MethodPut, pinPath(f.child), map[string]any{"pin": "111111"}), http.StatusNoContent, "")
	wantStatus(t, f.parent.dev.do(http.MethodPut, pinPath(f.parent), map[string]any{"pin": "333333"}), http.StatusNoContent, "")

	// Has a PIN now: proof required.
	wantStatus(t, f.child.dev.do(http.MethodPut, pinPath(f.child), map[string]any{"pin": nil}), http.StatusUnprocessableEntity, "validation_failed")
	wantStatus(t, f.child.dev.do(http.MethodPut, pinPath(f.child), map[string]any{"pin": nil, "currentPin": "000000"}), http.StatusForbidden, "invalid_pin")
	if n := e.pinFailures(f.child.id); n != 1 {
		t.Errorf("a wrong currentPin must count towards lockout, failures = %d", n)
	}
	// A CHILD cannot use the family password.
	wantStatus(t, f.child.dev.do(http.MethodPut, pinPath(f.child), map[string]any{"pin": nil, "password": testPassword}), http.StatusForbidden, "forbidden")
	wantStatus(t, f.child.dev.do(http.MethodPut, pinPath(f.child), map[string]any{"pin": nil, "currentPin": "111111"}), http.StatusNoContent, "")

	// A PARENT who forgot theirs may prove with the family password [I5].
	wantStatus(t, f.parent.dev.do(http.MethodPut, pinPath(f.parent), map[string]any{"pin": "444444", "password": "wrong password!"}), http.StatusForbidden, "invalid_password")
	wantStatus(t, f.parent.dev.do(http.MethodPut, pinPath(f.parent), map[string]any{"pin": "444444", "password": testPassword}), http.StatusNoContent, "")
	wantStatus(t, f.fsOnly.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": f.parent.id, "pin": "444444"}), http.StatusOK, "")
}
