package identity_test

import (
	"maps"
	"net/http"
	"slices"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/api"
)

// lookup reports whether a dotted path ("owner.name") names a key in body.
func lookup(body map[string]any, path string) bool {
	var cur any = body
	for part := range strings.SplitSeq(path, ".") {
		m, ok := cur.(map[string]any)
		if !ok {
			return false
		}
		if cur, ok = m[part]; !ok {
			return false
		}
	}
	return true
}

// The contract: validation_failed `fields` keys are the dotted JSON paths of
// the request body's fields. Each body below gets every field wrong, so the
// answer must name exactly those paths, and each must exist in the body.
func TestValidationFieldsAreDottedRequestPaths(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Paths")
	o := f.owner.dev
	tests := []struct {
		name         string
		dev          *device
		method, path string
		body         map[string]any
		want         []string
	}{
		{"register", e.device(), http.MethodPost, "/auth/register", map[string]any{
			"email": "nope", "password": "short", "familyName": " ", "deviceName": strings.Repeat("d", 61),
			"owner": map[string]any{"name": "", "colour": "beige", "avatar": "Cat!", "timezone": "Mars/Base"},
		}, []string{"deviceName", "email", "familyName", "owner.avatar", "owner.colour", "owner.name", "owner.timezone", "password"}},
		{"login", e.device(), http.MethodPost, "/auth/login", map[string]any{
			"email": "", "password": "", "deviceName": strings.Repeat("d", 61),
		}, []string{"deviceName", "email", "password"}},
		{"select profile", f.fsOnly, http.MethodPost, "/auth/profile-session", map[string]any{
			"profileId": f.child.id, "pin": "12",
		}, []string{"pin"}},
		{"create profile", o, http.MethodPost, "/profiles", map[string]any{
			"name": "", "role": "ADMIN", "colour": "beige", "avatar": "Cat!", "timezone": "Mars/Base", "pin": "1", "contactEmail": "",
		}, []string{"avatar", "colour", "contactEmail", "name", "pin", "role", "timezone"}},
		{"update profile", o, http.MethodPut, "/profiles/" + f.child.id, map[string]any{
			"name": "", "colour": "beige", "avatar": "Cat!", "timezone": "", "contactEmail": "x",
		}, []string{"avatar", "colour", "contactEmail", "name", "timezone"}},
		{"set pin", o, http.MethodPut, "/profiles/" + f.owner.id + "/pin", map[string]any{
			"pin": "abc", "currentPin": "1",
		}, []string{"currentPin", "pin"}},
		{"update family", o, http.MethodPut, "/family", map[string]any{"name": "", "autoLockMinutes": 0}, []string{"autoLockMinutes", "name"}},
		{"change email", o, http.MethodPut, "/family/email", map[string]any{"email": "x", "password": testPassword}, []string{"email"}},
		{"change password", o, http.MethodPut, "/family/password", map[string]any{"currentPassword": testPassword, "newPassword": "x"}, []string{"newPassword"}},
		{"transfer to a child", o, http.MethodPost, "/family/owner", map[string]any{"profileId": f.child.id, "password": testPassword}, []string{"profileId"}},
		{"delete family", o, http.MethodPost, "/family/delete", map[string]any{"password": testPassword, "confirmName": "wrong"}, []string{"confirmName"}},
	}
	for _, tt := range tests {
		rec := tt.dev.do(tt.method, tt.path, tt.body)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Errorf("%s: status %d %s", tt.name, rec.Code, rec.Body)
			continue
		}
		got := decode[api.Error](t, rec)
		if got.Error.Code != "validation_failed" || got.Error.Fields == nil {
			t.Errorf("%s: error %+v", tt.name, got.Error)
			continue
		}
		keys := slices.Sorted(maps.Keys(*got.Error.Fields))
		if !slices.Equal(keys, tt.want) {
			t.Errorf("%s: fields %v, want %v", tt.name, keys, tt.want)
		}
		for _, k := range keys {
			if !lookup(tt.body, k) {
				t.Errorf("%s: field key %q is not a path in the request body", tt.name, k)
			}
		}
	}
}
