package auth_test

import (
	"log/slog"
	"net/http"
	"slices"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/auth"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

const (
	email         = "family@example.com"
	familyCookie  = "cadence_family"
	profileCookie = "cadence_profile"
)

func deps(mode auth.RegistrationMode, pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) app.Deps {
	return app.Deps{Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvTest, Registration: mode, Now: now, Hasher: hasher}
}

func newServer(t *testing.T, mode auth.RegistrationMode) *testutil.Server {
	return testutil.NewServer(t, func(pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) (http.Handler, error) {
		return app.NewHandler(deps(mode, pool, now, hasher))
	})
}

func TestRegisterSignsInTheOwner(t *testing.T) {
	t.Parallel()
	d := newServer(t, auth.RegistrationOpen).Device(t)
	me := d.Register(email)
	if !me.Profile.IsOwner || me.Profile.Role != api.RolePARENT || !slices.Contains(me.Permissions, "family.account.manage") {
		t.Errorf("owner: %+v", me)
	}
	if d.Cookies[familyCookie] == "" || d.Cookies[profileCookie] == "" {
		t.Fatalf("cookies: %v", d.Cookies)
	}
	d.Call(http.MethodGet, "/me", nil, http.StatusOK)
}

func TestRegisterRejectsInvalidInput(t *testing.T) {
	t.Parallel()
	d := newServer(t, auth.RegistrationOpen).Device(t)
	rec := d.Do(http.MethodPost, "/auth/register", map[string]any{
		"email": "not-an-email", "password": "short", "familyName": "",
		"owner": map[string]any{"name": "Owner", "colour": "teal", "timezone": "Mars/Base"},
	})
	d.Expect(rec, http.StatusUnprocessableEntity, "validation_failed")
	fields := testutil.Decode[api.Error](t, rec).Error.Fields
	for _, f := range []string{"email", "password", "familyName", "owner.timezone"} {
		if _, ok := (*fields)[f]; !ok {
			t.Errorf("no error for %s: %v", f, fields)
		}
	}
}

func TestRegisterRejectsTakenEmail(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	srv.Device(t).Register(email)
	d := srv.Device(t)
	d.Expect(d.Do(http.MethodPost, "/auth/register", map[string]any{
		"email": "Family@Example.com", "password": testutil.Password, "familyName": "Other",
		"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "UTC"},
	}), http.StatusConflict, "email_taken")
}

func TestRegistrationClosesAfterFirstFamily(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationFirst)
	d := srv.Device(t)
	if !testutil.Decode[api.RegistrationStatus](t, d.Call(http.MethodGet, "/auth/registration", nil, http.StatusOK)).Open {
		t.Fatal("registration must start open")
	}
	d.Register(email)
	if testutil.Decode[api.RegistrationStatus](t, d.Call(http.MethodGet, "/auth/registration", nil, http.StatusOK)).Open {
		t.Error("registration still open after the first family")
	}
	other := srv.Device(t)
	other.Expect(other.Do(http.MethodPost, "/auth/register", map[string]any{
		"email": "second@example.com", "password": testutil.Password, "familyName": "Second",
		"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "UTC"},
	}), http.StatusForbidden, "registration_closed")
}

func TestRegisterIsRateLimitedPerIP(t *testing.T) {
	t.Parallel()
	d := newServer(t, auth.RegistrationOpen).Device(t)
	d.Register(email)
	for range 2 {
		d.Do(http.MethodPost, "/auth/register", map[string]any{})
	}
	rec := d.Do(http.MethodPost, "/auth/register", map[string]any{})
	d.Expect(rec, http.StatusTooManyRequests, "rate_limited")
	if rec.Header().Get("Retry-After") == "" {
		t.Error("no Retry-After")
	}
}

func TestLoginOpensFamilySessionOnly(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	srv.Device(t).Register(email)
	d := srv.Device(t)
	fs := d.Login(email)
	if fs.Family.Name != "Abbotts" || len(fs.Profiles) != 1 || !fs.Profiles[0].IsOwner {
		t.Errorf("picker: %+v", fs)
	}
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	d.Call(http.MethodGet, "/profiles", nil, http.StatusOK)
}

func TestLoginFailuresAreIndistinguishable(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	srv.Device(t).Register(email)
	d := srv.Device(t)
	d.Expect(d.Do(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": "wrong password!"}), http.StatusUnauthorized, "invalid_credentials")
	d.Expect(d.Do(http.MethodPost, "/auth/login", map[string]any{"email": "nobody@example.com", "password": testutil.Password}), http.StatusUnauthorized, "invalid_credentials")
}

func TestLoginIsRateLimitedPerEmail(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	srv.Device(t).Register(email)
	for range 10 {
		d := srv.Device(t)
		d.Expect(d.Do(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": "wrong password!"}), http.StatusUnauthorized, "invalid_credentials")
	}
	d := srv.Device(t)
	d.Expect(d.Do(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": testutil.Password}), http.StatusTooManyRequests, "rate_limited")
}

func TestLogoutEndsTheDevice(t *testing.T) {
	t.Parallel()
	d := newServer(t, auth.RegistrationOpen).Device(t)
	d.Register(email)
	stale := d.Cookies[familyCookie]
	d.Call(http.MethodPost, "/auth/logout", nil, http.StatusNoContent)
	if len(d.Cookies) != 0 {
		t.Errorf("cookies left: %v", d.Cookies)
	}
	d.Call(http.MethodPost, "/auth/logout", nil, http.StatusNoContent)
	d.Cookies[familyCookie] = stale
	d.Expect(d.Do(http.MethodGet, "/auth/session", nil), http.StatusUnauthorized, "family_session_required")
}

func TestProfileSessionIdleExpiryRenewsOnlyOnActiveRequests(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	d := srv.Device(t)
	d.Register(email)
	for range 2 {
		srv.Clock.Advance(20 * time.Minute)
		d.Call(http.MethodGet, "/me", nil, http.StatusOK)
	}
	d.Header.Set("X-Cadence-Passive", "1")
	srv.Clock.Advance(20 * time.Minute)
	d.Call(http.MethodGet, "/me", nil, http.StatusOK)
	srv.Clock.Advance(20 * time.Minute)
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	if _, ok := d.Cookies[profileCookie]; ok {
		t.Error("expired profile cookie not cleared")
	}
	d.Call(http.MethodGet, "/auth/session", nil, http.StatusOK)
}

func TestProfileSessionAbsoluteExpiry(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	d := srv.Device(t)
	d.Register(email)
	elapsed := time.Duration(0)
	for elapsed+25*time.Minute < auth.ProfileAbsoluteTimeout {
		srv.Clock.Advance(25 * time.Minute)
		elapsed += 25 * time.Minute
		d.Call(http.MethodGet, "/me", nil, http.StatusOK)
	}
	srv.Clock.Advance(25 * time.Minute)
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
}

func TestFamilySessionExpiryClearsCookies(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	d := srv.Device(t)
	d.Register(email)
	srv.Clock.Advance(auth.FamilyIdleTimeout)
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "family_session_required")
	if len(d.Cookies) != 0 {
		t.Errorf("cookies left: %v", d.Cookies)
	}
}

func TestFamilyAndProfileSessionAccess(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	owner := srv.Device(t)
	owner.Register(email)

	anon := srv.Device(t)
	anon.Expect(anon.Do(http.MethodGet, "/profiles", nil), http.StatusUnauthorized, "family_session_required")
	anon.Expect(anon.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "family_session_required")

	picker := srv.Device(t)
	picker.Login(email)
	picker.Call(http.MethodGet, "/auth/session", nil, http.StatusOK)
	picker.Expect(picker.Do(http.MethodGet, "/family", nil), http.StatusUnauthorized, "profile_session_required")
}

func TestProfileSessionIsBoundToItsDevice(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	a := srv.Device(t)
	me := a.Register(email)
	b := srv.Device(t)
	b.Join(email, me.Profile.Id, "")
	b.Cookies[profileCookie] = a.Cookies[profileCookie]
	b.Expect(b.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
}

func TestSelectProfileChecksPIN(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	owner := srv.Device(t)
	owner.Register(email)
	kid := owner.CreateProfile("Kid", "CHILD", "123456")

	d := srv.Device(t)
	d.Login(email)
	d.Expect(d.Select(kid.Id, ""), http.StatusUnprocessableEntity, "validation_failed")
	d.Expect(d.Select(kid.Id, "000000"), http.StatusForbidden, "invalid_pin")
	rec := d.Select(kid.Id, "123456")
	d.Expect(rec, http.StatusOK, "")
	if me := testutil.Decode[api.Me](t, rec); me.Profile.Id != kid.Id {
		t.Errorf("signed in as %s", me.Profile.Id)
	}
}

func TestLockAndSwitchKeepOneProfileSessionPerDevice(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	d := srv.Device(t)
	me := d.Register(email)
	kid := d.CreateProfile("Kid", "CHILD", "")

	ownerCookie := d.Cookies[profileCookie]
	d.Expect(d.Select(kid.Id, ""), http.StatusOK, "")
	if n := srv.Count(t, `SELECT count(*) FROM session WHERE kind = 'profile'`); n != 1 {
		t.Errorf("profile sessions after switch = %d", n)
	}
	stale := d.Cookies[profileCookie]
	d.Cookies[profileCookie] = ownerCookie
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")

	d.Cookies[profileCookie] = stale
	d.Call(http.MethodDelete, "/auth/profile-session", nil, http.StatusNoContent)
	if _, ok := d.Cookies[profileCookie]; ok {
		t.Error("lock kept the profile cookie")
	}
	d.Cookies[profileCookie] = stale
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	d.Expect(d.Select(me.Profile.Id, ""), http.StatusOK, "")
}

func TestDevicesListAndRevoke(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	a := srv.Device(t)
	me := a.Register(email)
	b := srv.Device(t)
	b.Join(email, me.Profile.Id, "")

	list := testutil.Decode[api.DeviceSessionList](t, a.Call(http.MethodGet, "/auth/sessions", nil, http.StatusOK)).Sessions
	if len(list) != 2 {
		t.Fatalf("devices = %d", len(list))
	}
	var mine, other api.DeviceSession
	for _, s := range list {
		if s.Current {
			mine = s
		} else {
			other = s
		}
	}
	if mine.Id == "" || other.ActiveProfileName == nil || *other.ActiveProfileName != "Owner" {
		t.Errorf("devices: %+v", list)
	}
	a.Call(http.MethodDelete, "/auth/sessions/"+other.Id, nil, http.StatusNoContent)
	b.Expect(b.Do(http.MethodGet, "/auth/session", nil), http.StatusUnauthorized, "family_session_required")
	a.Expect(a.Do(http.MethodDelete, "/auth/sessions/"+other.Id, nil), http.StatusNotFound, "not_found")
	a.Call(http.MethodDelete, "/auth/sessions/"+mine.Id, nil, http.StatusNoContent)
	if len(a.Cookies) != 0 {
		t.Errorf("revoking this device left cookies: %v", a.Cookies)
	}
}

func TestRevokeOtherDevices(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	a := srv.Device(t)
	a.Register(email)
	b, c := srv.Device(t), srv.Device(t)
	b.Login(email)
	c.Login(email)
	a.Call(http.MethodPost, "/auth/sessions/revoke-others", nil, http.StatusNoContent)
	b.Expect(b.Do(http.MethodGet, "/auth/session", nil), http.StatusUnauthorized, "family_session_required")
	c.Expect(c.Do(http.MethodGet, "/auth/session", nil), http.StatusUnauthorized, "family_session_required")
	a.Call(http.MethodGet, "/me", nil, http.StatusOK)
}

func TestChildCannotManageDevicesOrPassword(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	owner := srv.Device(t)
	owner.Register(email)
	kid := owner.CreateProfile("Kid", "CHILD", "")
	d := srv.Device(t)
	d.Join(email, kid.Id, "")
	d.Expect(d.Do(http.MethodGet, "/auth/sessions", nil), http.StatusForbidden, "forbidden")
	d.Expect(d.Do(http.MethodPost, "/auth/sessions/revoke-others", nil), http.StatusForbidden, "forbidden")
	d.Expect(d.Do(http.MethodPut, "/family/password", map[string]any{"currentPassword": testutil.Password, "newPassword": "a brand new password"}), http.StatusForbidden, "forbidden")
}

func TestChangePasswordSignsOutOtherDevices(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	a := srv.Device(t)
	a.Register(email)
	b := srv.Device(t)
	b.Login(email)

	a.Expect(a.Do(http.MethodPut, "/family/password", map[string]any{"currentPassword": "wrong password!", "newPassword": "a brand new password"}), http.StatusForbidden, "invalid_password")
	a.Expect(a.Do(http.MethodPut, "/family/password", map[string]any{"currentPassword": testutil.Password, "newPassword": "short"}), http.StatusUnprocessableEntity, "validation_failed")
	a.Call(http.MethodPut, "/family/password", map[string]any{"currentPassword": testutil.Password, "newPassword": "a brand new password"}, http.StatusNoContent)

	b.Expect(b.Do(http.MethodGet, "/auth/session", nil), http.StatusUnauthorized, "family_session_required")
	a.Call(http.MethodGet, "/me", nil, http.StatusOK)
	c := srv.Device(t)
	c.Expect(c.Do(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": testutil.Password}), http.StatusUnauthorized, "invalid_credentials")
	c.Call(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": "a brand new password"}, http.StatusOK)
}

func TestCleanupDeletesExpiredSessions(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationOpen)
	srv.Device(t).Register(email)
	srv.Clock.Advance(auth.ProfileAbsoluteTimeout)
	svc, err := app.NewAuthService(deps(auth.RegistrationOpen, srv.Pool, srv.Clock.Now, passhash.NewBcrypt(4)))
	if err != nil {
		t.Fatal(err)
	}
	if n, err := svc.CleanupExpiredSessions(t.Context()); err != nil || n != 1 {
		t.Fatalf("deleted %d, %v; want the profile session only", n, err)
	}
	if n := srv.Count(t, `SELECT count(*) FROM session WHERE kind = 'family'`); n != 1 {
		t.Errorf("family sessions = %d", n)
	}
}

func TestFamilyLifecycleEndToEnd(t *testing.T) {
	t.Parallel()
	srv := newServer(t, auth.RegistrationFirst)
	tablet := srv.Device(t)
	owner := tablet.Register(email)
	kid := tablet.CreateProfile("Kid", "CHILD", "123456")
	tablet.Call(http.MethodDelete, "/auth/profile-session", nil, http.StatusNoContent)

	rec := tablet.Select(kid.Id, "123456")
	tablet.Expect(rec, http.StatusOK, "")
	me := testutil.Decode[api.Me](t, rec)
	if slices.Contains(me.Permissions, "family.view") || !slices.Contains(me.Permissions, "meals.view") {
		t.Errorf("child permissions: %v", me.Permissions)
	}
	tablet.Expect(tablet.Do(http.MethodGet, "/family", nil), http.StatusForbidden, "forbidden")
	tablet.Call(http.MethodDelete, "/auth/profile-session", nil, http.StatusNoContent)

	tablet.Expect(tablet.Select(owner.Profile.Id, ""), http.StatusOK, "")
	tablet.Call(http.MethodPost, "/family/delete", map[string]any{"password": testutil.Password, "confirmName": "abbotts"}, http.StatusNoContent)
	if len(tablet.Cookies) != 0 {
		t.Errorf("cookies after delete: %v", tablet.Cookies)
	}
	tablet.Expect(tablet.Do(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": testutil.Password}), http.StatusUnauthorized, "invalid_credentials")
	if !testutil.Decode[api.RegistrationStatus](t, tablet.Call(http.MethodGet, "/auth/registration", nil, http.StatusOK)).Open {
		t.Error("registration must reopen once no family is left")
	}
}
