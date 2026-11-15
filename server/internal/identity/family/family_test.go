package family_test

import (
	"log/slog"
	"net/http"
	"slices"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/identity/auth"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

const email = "family@example.com"

func newServer(t *testing.T) *testutil.Server {
	return testutil.NewServer(t, func(pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) (http.Handler, error) {
		return app.NewHandler(app.Deps{Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvTest, Registration: auth.RegistrationOpen, Now: now, Hasher: hasher})
	})
}

func join(t *testing.T, srv *testutil.Server, p api.Profile, pin string) *testutil.Device {
	d := srv.Device(t)
	d.Join(email, p.Id, pin)
	return d
}

func TestReadAndUpdateFamily(t *testing.T) {
	t.Parallel()
	d := newServer(t).Device(t)
	d.Register(email)
	f := testutil.Decode[api.Family](t, d.Call(http.MethodGet, "/family", nil, http.StatusOK))
	if f.Email != email || f.AutoLockMinutes != 10 {
		t.Errorf("family: %+v", f)
	}
	d.Expect(d.Do(http.MethodPut, "/family", map[string]any{"name": "Abbotts", "autoLockMinutes": 31}), http.StatusUnprocessableEntity, "validation_failed")
	d.Call(http.MethodPut, "/family", map[string]any{"name": " The Abbotts ", "autoLockMinutes": 5}, http.StatusOK)
	s := testutil.Decode[api.FamilySession](t, d.Call(http.MethodGet, "/auth/session", nil, http.StatusOK))
	if s.Family.Name != "The Abbotts" || s.Family.AutoLockMinutes != 5 {
		t.Errorf("summary: %+v", s.Family)
	}
}

func TestChildCannotReadOrChangeFamily(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	owner := srv.Device(t)
	owner.Register(email)
	d := join(t, srv, owner.CreateProfile("Kid", "CHILD", ""), "")
	d.Expect(d.Do(http.MethodGet, "/family", nil), http.StatusForbidden, "forbidden")
	d.Expect(d.Do(http.MethodPut, "/family", map[string]any{"name": "Mine", "autoLockMinutes": 30}), http.StatusForbidden, "forbidden")
	d.Expect(d.Do(http.MethodPut, "/modules/meals", map[string]any{"enabled": false}), http.StatusForbidden, "forbidden")
	d.Call(http.MethodGet, "/modules", nil, http.StatusOK)
}

func TestModuleToggleAppliesOnTheNextRequest(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	owner := srv.Device(t)
	owner.Register(email)
	kid := join(t, srv, owner.CreateProfile("Kid", "CHILD", ""), "")

	mods := testutil.Decode[api.ModuleList](t, owner.Call(http.MethodGet, "/modules", nil, http.StatusOK)).Modules
	if len(mods) != 1 || mods[0].Id != "meals" || !mods[0].Enabled {
		t.Fatalf("modules: %+v", mods)
	}
	owner.Call(http.MethodPut, "/modules/meals", map[string]any{"enabled": false}, http.StatusOK)
	me := testutil.Decode[api.Me](t, kid.Call(http.MethodGet, "/me", nil, http.StatusOK))
	if len(me.Modules) != 0 || slices.Contains(me.Permissions, "meals.view") {
		t.Errorf("disabled module still granted: %+v", me)
	}
	owner.Call(http.MethodPut, "/modules/meals", map[string]any{"enabled": true}, http.StatusOK)
	if me := testutil.Decode[api.Me](t, kid.Call(http.MethodGet, "/me", nil, http.StatusOK)); !slices.Contains(me.Permissions, "meals.view") {
		t.Errorf("re-enabled module not granted: %v", me.Permissions)
	}
	owner.Expect(owner.Do(http.MethodPut, "/modules/chores", map[string]any{"enabled": true}), http.StatusNotFound, "not_found")
}

func TestChangeEmailIsForTheOwner(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	srv.Device(t).Register("taken@example.com")
	owner := srv.Device(t)
	owner.Register(email)
	pat := join(t, srv, owner.CreateProfile("Pat", "PARENT", ""), "")

	pat.Expect(pat.Do(http.MethodPut, "/family/email", map[string]any{"email": "new@example.com", "password": testutil.Password}), http.StatusForbidden, "forbidden")
	owner.Expect(owner.Do(http.MethodPut, "/family/email", map[string]any{"email": "new@example.com", "password": "wrong password!"}), http.StatusForbidden, "invalid_password")
	owner.Expect(owner.Do(http.MethodPut, "/family/email", map[string]any{"email": "taken@example.com", "password": testutil.Password}), http.StatusConflict, "email_taken")
	owner.Call(http.MethodPut, "/family/email", map[string]any{"email": "New@Example.com", "password": testutil.Password}, http.StatusOK)
	srv.Device(t).Login("new@example.com")
}

func TestDeleteFamilyRequiresTheOwner(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	owner := srv.Device(t)
	owner.Register(email)
	pat := join(t, srv, owner.CreateProfile("Pat", "PARENT", ""), "")
	body := func(password, name string) map[string]any {
		return map[string]any{"password": password, "confirmName": name}
	}

	pat.Expect(pat.Do(http.MethodPost, "/family/delete", body(testutil.Password, "Abbotts")), http.StatusForbidden, "forbidden")
	owner.Expect(owner.Do(http.MethodPost, "/family/delete", body("wrong password!", "Abbotts")), http.StatusForbidden, "invalid_password")
	owner.Expect(owner.Do(http.MethodPost, "/family/delete", body(testutil.Password, "Someone else")), http.StatusUnprocessableEntity, "validation_failed")
	if n := srv.Count(t, `SELECT count(*) FROM family`); n != 1 {
		t.Errorf("families = %d", n)
	}
}

func TestDeleteFamilyRemovesEverything(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	other := srv.Device(t)
	other.Register("other@example.com")

	owner := srv.Device(t)
	me := owner.Register(email)
	kid := owner.CreateProfile("Kid", "CHILD", "123456")
	kidDevice := join(t, srv, kid, "123456")
	kidDevice.Do(http.MethodDelete, "/auth/profile-session", nil)
	kidDevice.Select(kid.Id, "000000")
	owner.Call(http.MethodPut, "/modules/meals", map[string]any{"enabled": false}, http.StatusOK)
	if srv.Count(t, `SELECT count(*) FROM pin_attempt`) != 1 {
		t.Fatal("setup: no PIN failure recorded")
	}

	owner.Call(http.MethodPost, "/family/delete", map[string]any{"password": testutil.Password, "confirmName": "Abbotts"}, http.StatusNoContent)
	kidDevice.Expect(kidDevice.Do(http.MethodGet, "/auth/session", nil), http.StatusUnauthorized, "family_session_required")
	for _, q := range []string{
		`SELECT count(*) FROM family WHERE id = $1`,
		`SELECT count(*) FROM profile WHERE family_id = $1`,
		`SELECT count(*) FROM session WHERE family_id = $1`,
		`SELECT count(*) FROM family_module WHERE family_id = $1`,
	} {
		if n := srv.Count(t, q, me.Family.Id); n != 0 {
			t.Errorf("%s: %d rows left", q, n)
		}
	}
	if n := srv.Count(t, `SELECT count(*) FROM pin_attempt`); n != 0 {
		t.Errorf("pin_attempt rows left: %d", n)
	}
	other.Call(http.MethodGet, "/me", nil, http.StatusOK)
	srv.Device(t).Register(email)
}

func TestFamiliesCannotReachEachOther(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	a := srv.Device(t)
	aMe := a.Register(email)
	aKid := a.CreateProfile("Kid", "CHILD", "")
	aDevices := testutil.Decode[api.DeviceSessionList](t, a.Call(http.MethodGet, "/auth/sessions", nil, http.StatusOK)).Sessions

	b := srv.Device(t)
	b.Register("other@example.com")
	for _, c := range []struct {
		method, path string
		body         any
	}{
		{http.MethodGet, "/profiles/" + aKid.Id, nil},
		{http.MethodPut, "/profiles/" + aKid.Id, map[string]any{"name": "X", "colour": "sky", "avatar": nil, "timezone": "UTC", "contactEmail": nil}},
		{http.MethodDelete, "/profiles/" + aKid.Id, nil},
		{http.MethodPut, "/profiles/" + aKid.Id + "/role", map[string]any{"role": "PARENT"}},
		{http.MethodPut, "/profiles/" + aKid.Id + "/pin", map[string]any{"pin": "111111"}},
		{http.MethodDelete, "/auth/sessions/" + aDevices[0].Id, nil},
		{http.MethodPost, "/family/owner", map[string]any{"profileId": aMe.Profile.Id, "password": testutil.Password}},
		{http.MethodPost, "/auth/profile-session", map[string]any{"profileId": aKid.Id}},
	} {
		b.Expect(b.Do(c.method, c.path, c.body), http.StatusNotFound, "not_found")
	}
	a.Call(http.MethodGet, "/profiles/"+aKid.Id, nil, http.StatusOK)
}

func TestPasswordReauthIsRateLimited(t *testing.T) {
	t.Parallel()
	d := newServer(t).Device(t)
	d.Register(email)
	for range 5 {
		d.Expect(d.Do(http.MethodPut, "/family/email", map[string]any{"email": "new@example.com", "password": "wrong password!"}), http.StatusForbidden, "invalid_password")
	}
	d.Expect(d.Do(http.MethodPost, "/family/delete", map[string]any{"password": testutil.Password, "confirmName": "Abbotts"}), http.StatusTooManyRequests, "rate_limited")
}
