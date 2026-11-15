package identity_test

import (
	"net/http"
	"slices"
	"testing"

	"github.com/chris-abs/cadence/server/internal/api"
)

// TestHappyPath walks the main flow end to end through the real router.
func TestHappyPath(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f, me := e.register("The Smiths")

	if !me.Profile.IsOwner || me.Profile.Role != api.RolePARENT || me.PinAdvised {
		t.Errorf("owner me = %+v", me.Profile)
	}
	if !slices.Contains(me.Permissions, "family.account.manage") || !slices.Contains(me.Permissions, "meals.recipes.edit") {
		t.Errorf("owner permissions = %v", me.Permissions)
	}
	if len(me.Modules) != 1 || me.Modules[0].Id != "meals" {
		t.Errorf("modules = %+v", me.Modules)
	}
	if me.Session.IdleTimeoutSeconds != 1800 {
		t.Errorf("idle timeout = %d", me.Session.IdleTimeoutSeconds)
	}

	kid := f.owner.create("Kit", "CHILD")
	got := decode[api.Me](t, f.owner.dev.do(http.MethodGet, "/me", nil))
	if !got.PinAdvised {
		t.Error("a PARENT without a PIN in a family with a CHILD is advised to set one")
	}

	// Lock, then pick the child on the same device.
	wantStatus(t, f.owner.dev.do(http.MethodDelete, "/auth/profile-session", nil), http.StatusNoContent, "")
	wantStatus(t, f.owner.dev.do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
	picker := decode[api.ProfileList](t, f.owner.dev.do(http.MethodGet, "/profiles", nil))
	if len(picker.Profiles) != 2 || !picker.Profiles[0].IsOwner {
		t.Errorf("picker = %+v", picker.Profiles)
	}
	rec := f.owner.dev.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": kid})
	wantStatus(t, rec, http.StatusOK, "")
	child := decode[api.Me](t, rec)
	if child.Profile.Role != api.RoleCHILD || slices.Contains(child.Permissions, "family.view") {
		t.Errorf("child me = %+v %v", child.Profile, child.Permissions)
	}
	wantStatus(t, f.owner.dev.do(http.MethodGet, "/family", nil), http.StatusForbidden, "forbidden")

	// Log out: both cookies go and the family routes refuse the device.
	wantStatus(t, f.owner.dev.do(http.MethodPost, "/auth/logout", nil), http.StatusNoContent, "")
	if len(f.owner.dev.cookies) != 0 {
		t.Errorf("cookies left after logout: %v", f.owner.dev.cookies)
	}
	wantStatus(t, f.owner.dev.do(http.MethodGet, "/profiles", nil), http.StatusUnauthorized, "family_session_required")
	// Logout is idempotent.
	wantStatus(t, f.owner.dev.do(http.MethodPost, "/auth/logout", nil), http.StatusNoContent, "")
}

func TestCookieAttributes(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	dev := e.device()
	rec := dev.do(http.MethodPost, "/auth/register", map[string]any{
		"email": "c@example.com", "password": testPassword, "familyName": "C",
		"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "UTC"},
	})
	wantStatus(t, rec, http.StatusCreated, "")
	byName := map[string]*http.Cookie{}
	for _, c := range rec.Result().Cookies() {
		byName[c.Name] = c
	}
	for name, maxAge := range map[string]int{familyCookie: 90 * 24 * 3600, profileCookie: 12 * 3600} {
		c := byName[name]
		if c == nil {
			t.Fatalf("cookie %s not set", name)
		}
		if !c.HttpOnly || !c.Secure || c.SameSite != http.SameSiteStrictMode || c.Path != "/" || c.Domain != "" || c.MaxAge != maxAge {
			t.Errorf("%s attributes = %+v", name, c)
		}
	}
	// Logout clears both with Max-Age=0.
	rec = dev.do(http.MethodPost, "/auth/logout", nil)
	cleared := 0
	for _, c := range rec.Result().Cookies() {
		if c.MaxAge < 0 && c.Value == "" {
			cleared++
		}
	}
	if cleared != 2 {
		t.Errorf("logout cleared %d cookies, want 2", cleared)
	}
}

func TestRegistrationModes(t *testing.T) {
	t.Parallel()
	body := func(email string) map[string]any {
		return map[string]any{
			"email": email, "password": testPassword, "familyName": "F",
			"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "UTC"},
		}
	}
	t.Run("closed", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t, withRegistration("closed"))
		d := e.device()
		if decode[api.RegistrationStatus](t, d.do(http.MethodGet, "/auth/registration", nil)).Open {
			t.Error("closed registration reports open")
		}
		wantStatus(t, d.do(http.MethodPost, "/auth/register", body("a@example.com")), http.StatusForbidden, "registration_closed")
	})
	t.Run("first", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t, withRegistration("first"))
		d := e.device()
		if !decode[api.RegistrationStatus](t, d.do(http.MethodGet, "/auth/registration", nil)).Open {
			t.Error("first mode with no family must be open")
		}
		wantStatus(t, d.do(http.MethodPost, "/auth/register", body("a@example.com")), http.StatusCreated, "")
		if decode[api.RegistrationStatus](t, d.do(http.MethodGet, "/auth/registration", nil)).Open {
			t.Error("first mode closes once a family exists")
		}
		wantStatus(t, e.device().do(http.MethodPost, "/auth/register", body("b@example.com")), http.StatusForbidden, "registration_closed")
	})
	t.Run("duplicate email", func(t *testing.T) {
		t.Parallel()
		e := newEnv(t)
		wantStatus(t, e.device().do(http.MethodPost, "/auth/register", body("dup@example.com")), http.StatusCreated, "")
		wantStatus(t, e.device().do(http.MethodPost, "/auth/register", body(" DUP@example.com ")), http.StatusConflict, "email_taken")
		var n int
		if err := e.pool.QueryRow(t.Context(), `SELECT count(*) FROM profile`).Scan(&n); err != nil || n != 1 {
			t.Errorf("profiles after failed register = %d (%v); the transaction must roll back", n, err)
		}
	})
}

func TestValidation(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("V")
	o := f.owner.dev

	tests := []struct {
		name, method, path string
		body               any
		field              string
	}{
		{"short password", http.MethodPost, "/auth/register", map[string]any{"email": "x@example.com", "password": "short", "familyName": "F",
			"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "UTC"}}, "password"},
		{"bad timezone", http.MethodPost, "/auth/register", map[string]any{"email": "x@example.com", "password": testPassword, "familyName": "F",
			"owner": map[string]any{"name": "O", "colour": "teal", "timezone": "Mars/Base"}}, "owner.timezone"},
		{"bad colour", http.MethodPost, "/profiles", map[string]any{"name": "N", "role": "CHILD", "colour": "beige"}, "colour"},
		{"bad role", http.MethodPost, "/profiles", map[string]any{"name": "N", "role": "ADMIN", "colour": "red"}, "role"},
		{"short pin", http.MethodPost, "/profiles", map[string]any{"name": "N", "role": "CHILD", "colour": "red", "pin": "123"}, "pin"},
		{"control char name", http.MethodPost, "/profiles", map[string]any{"name": "a\u0007b", "role": "CHILD", "colour": "red"}, "name"},
		{"long name", http.MethodPost, "/profiles", map[string]any{"name": "abcdefghijklmnopqrstuvwxyzabcdefghijklmno", "role": "CHILD", "colour": "red"}, "name"},
		{"bad avatar", http.MethodPost, "/profiles", map[string]any{"name": "N", "role": "CHILD", "colour": "red", "avatar": "Cat!"}, "avatar"},
		{"auto lock range", http.MethodPut, "/family", map[string]any{"name": "V", "autoLockMinutes": 31}, "autoLockMinutes"},
		{"pin key missing", http.MethodPut, "/profiles/" + f.owner.id + "/pin", map[string]any{}, "pin"},
		{"avatar key missing", http.MethodPut, "/profiles/" + f.owner.id, map[string]any{"name": "Olive", "colour": "teal", "timezone": "UTC", "contactEmail": nil}, "avatar"},
	}
	for _, tt := range tests {
		rec := o.do(tt.method, tt.path, tt.body)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Errorf("%s: status %d, body %s", tt.name, rec.Code, rec.Body)
			continue
		}
		got := decode[api.Error](t, rec)
		if got.Error.Code != "validation_failed" || got.Error.Fields == nil || (*got.Error.Fields)[tt.field] == "" {
			t.Errorf("%s: error %+v, want a message for %q", tt.name, got.Error, tt.field)
		}
	}

	// Malformed JSON stays 400; a duplicate name (any case) is 409.
	wantStatus(t, o.do(http.MethodPost, "/profiles", `{"name":`), http.StatusBadRequest, "invalid_request")
	wantStatus(t, o.do(http.MethodPost, "/profiles", map[string]any{"name": " kit ", "role": "CHILD", "colour": "red"}), http.StatusConflict, "name_taken")
}

func TestProfileLimit(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f, _ := e.register("Big")
	for i := 2; i <= 20; i++ {
		f.owner.create("P"+string(rune('a'+i)), "CHILD")
	}
	rec := f.owner.dev.do(http.MethodPost, "/profiles", map[string]any{"name": "One too many", "role": "CHILD", "colour": "red"})
	wantStatus(t, rec, http.StatusConflict, "profile_limit_reached")
}
