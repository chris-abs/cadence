package profile_test

import (
	"fmt"
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

type family struct {
	srv   *testutil.Server
	owner *testutil.Device
	me    api.Me
}

func newFamily(t *testing.T) family {
	srv := testutil.NewServer(t, func(pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) (http.Handler, error) {
		return app.NewHandler(app.Deps{Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvTest, Registration: auth.RegistrationOpen, Now: now, Hasher: hasher})
	})
	owner := srv.Device(t)
	return family{srv: srv, owner: owner, me: owner.Register(email)}
}

func (f family) as(t *testing.T, p api.Profile, pin string) *testutil.Device {
	d := f.srv.Device(t)
	d.Join(email, p.Id, pin)
	return d
}

func display(name string) map[string]any {
	return map[string]any{"name": name, "colour": "sky", "avatar": nil, "timezone": "UTC", "contactEmail": nil}
}

func TestCreateProfileJoinsThePicker(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	kid := f.owner.CreateProfile("Kid", "CHILD", "123456")
	if kid.Role != api.RoleCHILD || !kid.HasPin || kid.Timezone != "Europe/London" {
		t.Errorf("created: %+v", kid)
	}
	picker := testutil.Decode[api.ProfileList](t, f.owner.Call(http.MethodGet, "/profiles", nil, http.StatusOK)).Profiles
	if len(picker) != 2 || !picker[0].IsOwner || picker[1].Id != kid.Id {
		t.Errorf("picker: %+v", picker)
	}
}

func TestProfileNamesAreUniquePerFamily(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	f.owner.CreateProfile("Kid", "CHILD", "")
	f.owner.Expect(f.owner.Do(http.MethodPost, "/profiles", map[string]any{"name": " kid ", "colour": "sky", "role": "CHILD"}), http.StatusConflict, "name_taken")
}

func TestProfileLimit(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	for i := range 19 {
		f.owner.CreateProfile(fmt.Sprintf("Kid %d", i), "CHILD", "")
	}
	f.owner.Expect(f.owner.Do(http.MethodPost, "/profiles", map[string]any{"name": "One more", "colour": "sky", "role": "CHILD"}), http.StatusConflict, "profile_limit_reached")
}

func TestUpdateProfile(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	kid := f.owner.CreateProfile("Kid", "CHILD", "")
	d := f.as(t, kid, "")

	got := testutil.Decode[api.Profile](t, d.Call(http.MethodPut, "/profiles/"+kid.Id, display("Kiddo"), http.StatusOK))
	if got.Name != "Kiddo" || got.Colour != "sky" || got.Timezone != "UTC" {
		t.Errorf("self edit: %+v", got)
	}
	f.owner.Call(http.MethodPut, "/profiles/"+kid.Id, display("Sam"), http.StatusOK)
	f.owner.Expect(f.owner.Do(http.MethodPut, "/profiles/"+kid.Id, map[string]any{"name": "Sam", "colour": "sky", "timezone": "UTC"}), http.StatusUnprocessableEntity, "validation_failed")
}

func TestChildCannotManageProfiles(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	kid := f.owner.CreateProfile("Kid", "CHILD", "")
	sib := f.owner.CreateProfile("Sib", "CHILD", "")
	d := f.as(t, kid, "")
	for _, c := range []struct {
		method, path string
		body         any
	}{
		{http.MethodPost, "/profiles", map[string]any{"name": "New", "colour": "sky", "role": "CHILD"}},
		{http.MethodPut, "/profiles/" + sib.Id, display("Renamed")},
		{http.MethodDelete, "/profiles/" + sib.Id, nil},
		{http.MethodPut, "/profiles/" + kid.Id + "/role", map[string]any{"role": "PARENT"}},
		{http.MethodPut, "/profiles/" + sib.Id + "/pin", map[string]any{"pin": "111111"}},
	} {
		d.Expect(d.Do(c.method, c.path, c.body), http.StatusForbidden, "forbidden")
	}
}

func TestChangeRoleAppliesAndSignsTheTargetOut(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	pat := f.owner.CreateProfile("Pat", "PARENT", "")
	d := f.as(t, pat, "")
	got := testutil.Decode[api.Profile](t, f.owner.Call(http.MethodPut, "/profiles/"+pat.Id+"/role", map[string]any{"role": "CHILD"}, http.StatusOK))
	if got.Role != api.RoleCHILD {
		t.Errorf("role = %s", got.Role)
	}
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	d.Expect(d.Select(pat.Id, ""), http.StatusOK, "")
	d.Expect(d.Do(http.MethodGet, "/family", nil), http.StatusForbidden, "forbidden")
}

func TestOwnerAndSelfAreProtected(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	pat := f.owner.CreateProfile("Pat", "PARENT", "")
	d := f.as(t, pat, "")
	ownerID := f.me.Profile.Id
	d.Expect(d.Do(http.MethodPut, "/profiles/"+ownerID+"/role", map[string]any{"role": "CHILD"}), http.StatusConflict, "owner_protected")
	d.Expect(d.Do(http.MethodDelete, "/profiles/"+ownerID, nil), http.StatusConflict, "owner_protected")
	d.Expect(d.Do(http.MethodPut, "/profiles/"+pat.Id+"/role", map[string]any{"role": "CHILD"}), http.StatusConflict, "self_not_allowed")
	d.Expect(d.Do(http.MethodDelete, "/profiles/"+pat.Id, nil), http.StatusConflict, "self_not_allowed")
}

func TestDeleteProfile(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	kid := f.owner.CreateProfile("Kid", "CHILD", "123456")
	d := f.as(t, kid, "123456")
	f.owner.Call(http.MethodDelete, "/profiles/"+kid.Id, nil, http.StatusNoContent)
	f.owner.Expect(f.owner.Do(http.MethodGet, "/profiles/"+kid.Id, nil), http.StatusNotFound, "not_found")
	d.Expect(d.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	if n := f.srv.Count(t, `SELECT count(*) FROM profile`); n != 1 {
		t.Errorf("profiles left = %d", n)
	}
}

func TestTransferOwnership(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	pat := f.owner.CreateProfile("Pat", "PARENT", "")
	kid := f.owner.CreateProfile("Kid", "CHILD", "")
	f.owner.Expect(f.owner.Do(http.MethodPost, "/family/owner", map[string]any{"profileId": pat.Id, "password": "wrong password!"}), http.StatusForbidden, "invalid_password")
	f.owner.Expect(f.owner.Do(http.MethodPost, "/family/owner", map[string]any{"profileId": kid.Id, "password": testutil.Password}), http.StatusUnprocessableEntity, "validation_failed")
	f.owner.Call(http.MethodPost, "/family/owner", map[string]any{"profileId": pat.Id, "password": testutil.Password}, http.StatusNoContent)

	me := testutil.Decode[api.Me](t, f.owner.Call(http.MethodGet, "/me", nil, http.StatusOK))
	if me.Profile.IsOwner || slices.Contains(me.Permissions, "family.account.manage") {
		t.Errorf("old owner keeps ownership: %+v", me)
	}
	d := f.as(t, pat, "")
	if me := testutil.Decode[api.Me](t, d.Call(http.MethodGet, "/me", nil, http.StatusOK)); !me.Profile.IsOwner {
		t.Error("new owner is not the owner")
	}
}

func TestSetOwnPIN(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	self := "/profiles/" + f.me.Profile.Id + "/pin"
	f.owner.Call(http.MethodPut, self, map[string]any{"pin": "111111"}, http.StatusNoContent)
	f.owner.Expect(f.owner.Do(http.MethodPut, self, map[string]any{"pin": "222222"}), http.StatusUnprocessableEntity, "validation_failed")
	f.owner.Expect(f.owner.Do(http.MethodPut, self, map[string]any{"pin": "222222", "currentPin": "999999"}), http.StatusForbidden, "invalid_pin")
	f.owner.Call(http.MethodPut, self, map[string]any{"pin": "222222", "currentPin": "111111"}, http.StatusNoContent)
	f.owner.Call(http.MethodPut, self, map[string]any{"pin": "333333", "password": testutil.Password}, http.StatusNoContent)
	f.owner.Call(http.MethodPut, self, map[string]any{"pin": nil, "currentPin": "333333"}, http.StatusNoContent)
	if me := testutil.Decode[api.Me](t, f.owner.Call(http.MethodGet, "/me", nil, http.StatusOK)); me.Profile.HasPin {
		t.Error("PIN not removed")
	}

	kid := f.owner.CreateProfile("Kid", "CHILD", "123456")
	d := f.as(t, kid, "123456")
	d.Expect(d.Do(http.MethodPut, "/profiles/"+kid.Id+"/pin", map[string]any{"pin": "222222", "password": testutil.Password}), http.StatusForbidden, "forbidden")
}

func TestResetAnotherProfilesPIN(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	kid := f.owner.CreateProfile("Kid", "CHILD", "123456")
	pat := f.owner.CreateProfile("Pat", "PARENT", "")
	kidDevice := f.as(t, kid, "123456")
	patDevice := f.as(t, pat, "")

	patDevice.Call(http.MethodPut, "/profiles/"+kid.Id+"/pin", map[string]any{"pin": "654321"}, http.StatusNoContent)
	kidDevice.Expect(kidDevice.Do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	kidDevice.Expect(kidDevice.Select(kid.Id, "654321"), http.StatusOK, "")

	patDevice.Expect(patDevice.Do(http.MethodPut, "/profiles/"+f.me.Profile.Id+"/pin", map[string]any{"pin": "111111"}), http.StatusForbidden, "forbidden")
	f.owner.Call(http.MethodPut, "/profiles/"+pat.Id+"/pin", map[string]any{"pin": "111111"}, http.StatusNoContent)
}

func TestPINLockoutEscalatesAndResetsOnSuccess(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	kid := f.owner.CreateProfile("Kid", "CHILD", "123456")
	d := f.srv.Device(t)
	d.Login(email)
	for range 4 {
		d.Expect(d.Select(kid.Id, "000000"), http.StatusForbidden, "invalid_pin")
	}
	rec := d.Select(kid.Id, "000000")
	d.Expect(rec, http.StatusTooManyRequests, "pin_locked")
	if rec.Header().Get("Retry-After") != "30" {
		t.Errorf("Retry-After = %q", rec.Header().Get("Retry-After"))
	}
	d.Expect(d.Select(kid.Id, "123456"), http.StatusTooManyRequests, "pin_locked")
	picker := testutil.Decode[api.ProfileList](t, d.Call(http.MethodGet, "/profiles", nil, http.StatusOK)).Profiles
	if picker[1].LockedForSeconds == nil || *picker[1].LockedForSeconds != 30 {
		t.Errorf("picker lock: %+v", picker[1])
	}

	f.srv.Clock.Advance(30 * time.Second)
	rec = d.Select(kid.Id, "000000")
	d.Expect(rec, http.StatusTooManyRequests, "pin_locked")
	if rec.Header().Get("Retry-After") != "60" {
		t.Errorf("sixth failure Retry-After = %q", rec.Header().Get("Retry-After"))
	}

	f.srv.Clock.Advance(time.Minute)
	d.Expect(d.Select(kid.Id, "123456"), http.StatusOK, "")
	for range 4 {
		d.Expect(d.Select(kid.Id, "000000"), http.StatusForbidden, "invalid_pin")
	}
}

func TestResettingAPINClearsItsLockout(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	kid := f.owner.CreateProfile("Kid", "CHILD", "123456")
	d := f.srv.Device(t)
	d.Login(email)
	for range 5 {
		d.Select(kid.Id, "000000")
	}
	f.owner.Call(http.MethodPut, "/profiles/"+kid.Id+"/pin", map[string]any{"pin": "654321"}, http.StatusNoContent)
	d.Expect(d.Select(kid.Id, "654321"), http.StatusOK, "")
}

func TestContactEmailIsOptionalAndPrivate(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	f.owner.Expect(f.owner.Do(http.MethodPost, "/profiles", map[string]any{"name": "Pat", "colour": "sky", "role": "PARENT", "contactEmail": "nope"}), http.StatusUnprocessableEntity, "validation_failed")
	pat := testutil.Decode[api.Profile](t, f.owner.Call(http.MethodPost, "/profiles", map[string]any{"name": "Pat", "colour": "sky", "role": "PARENT", "contactEmail": "Pat@Example.com"}, http.StatusCreated))
	if pat.ContactEmail == nil || *pat.ContactEmail != "pat@example.com" {
		t.Errorf("contact email: %v", pat.ContactEmail)
	}
	kid := f.owner.CreateProfile("Kid", "CHILD", "")
	d := f.as(t, kid, "")
	if seen := testutil.Decode[api.Profile](t, d.Call(http.MethodGet, "/profiles/"+pat.Id, nil, http.StatusOK)); seen.ContactEmail != nil {
		t.Error("a child can see another profile's contact email")
	}
	cleared := testutil.Decode[api.Profile](t, f.owner.Call(http.MethodPut, "/profiles/"+pat.Id, display("Pat"), http.StatusOK))
	if cleared.ContactEmail != nil {
		t.Error("null did not clear the contact email")
	}
}

func TestPINIsAdvisedForParentsOfChildren(t *testing.T) {
	t.Parallel()
	f := newFamily(t)
	if f.me.PinAdvised {
		t.Error("advised without a child profile")
	}
	f.owner.CreateProfile("Kid", "CHILD", "")
	if !testutil.Decode[api.Me](t, f.owner.Call(http.MethodGet, "/me", nil, http.StatusOK)).PinAdvised {
		t.Error("not advised with a child profile")
	}
	f.owner.Call(http.MethodPut, "/profiles/"+f.me.Profile.Id+"/pin", map[string]any{"pin": "111111"}, http.StatusNoContent)
	if testutil.Decode[api.Me](t, f.owner.Call(http.MethodGet, "/me", nil, http.StatusOK)).PinAdvised {
		t.Error("still advised after setting a PIN")
	}
}
