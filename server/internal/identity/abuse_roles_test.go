package identity_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"
)

// Abuse 4 (R4, R5): a CHILD cannot create profiles, change any role (its own
// included), delete profiles or reset another profile's PIN.
func TestChildCannotEscalate(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Kids")
	c := f.child.dev
	wantStatus(t, c.do(http.MethodPost, "/profiles", map[string]any{"name": "Boss", "role": "PARENT", "colour": "red"}), http.StatusForbidden, "forbidden")
	for _, id := range []string{f.child.id, f.parent.id, f.owner.id} {
		wantStatus(t, c.do(http.MethodPut, "/profiles/"+id+"/role", map[string]any{"role": "PARENT"}), http.StatusForbidden, "forbidden")
	}
	wantStatus(t, c.do(http.MethodDelete, "/profiles/"+f.parent.id, nil), http.StatusForbidden, "forbidden")
	wantStatus(t, c.do(http.MethodPut, "/profiles/"+f.parent.id+"/pin", map[string]any{"pin": nil}), http.StatusForbidden, "forbidden")
}

// Abuse 5 (R5, R6): a PARENT cannot change its own or the owner's role, or
// delete itself or the owner.
func TestParentCannotRemoveOwnerOrSelf(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Guard")
	p := f.parent.dev
	wantStatus(t, p.do(http.MethodPut, "/profiles/"+f.parent.id+"/role", map[string]any{"role": "CHILD"}), http.StatusConflict, "self_not_allowed")
	wantStatus(t, p.do(http.MethodPut, "/profiles/"+f.owner.id+"/role", map[string]any{"role": "CHILD"}), http.StatusConflict, "owner_protected")
	wantStatus(t, p.do(http.MethodDelete, "/profiles/"+f.parent.id, nil), http.StatusConflict, "self_not_allowed")
	wantStatus(t, p.do(http.MethodDelete, "/profiles/"+f.owner.id, nil), http.StatusConflict, "owner_protected")
}

// Abuse 6 (R8, R9): role and isOwner cannot ride along on a profile update.
func TestMassAssignmentRejected(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Mass")
	base := map[string]any{"name": "Kit", "colour": "rose", "avatar": nil, "timezone": "UTC", "contactEmail": nil}
	for _, extra := range []string{"role", "isOwner"} {
		body := map[string]any{extra: "PARENT"}
		if extra == "isOwner" {
			body[extra] = true
		}
		for k, v := range base {
			body[k] = v
		}
		wantStatus(t, f.child.dev.do(http.MethodPut, "/profiles/"+f.child.id, body), http.StatusBadRequest, "invalid_request")
	}
	wantStatus(t, f.owner.dev.do(http.MethodPost, "/profiles",
		map[string]any{"name": "Fake", "role": "PARENT", "colour": "red", "isOwner": true}), http.StatusBadRequest, "invalid_request")
}

// Abuse 7 (R7): another family's ids are not found on every {id} route, even
// for that family's owner, and nothing about them changes.
func TestCrossFamilyIDsAreNotFound(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	a, b := e.newFamily("A"), e.newFamily("B")
	bChild, bDevice := b.child.id, b.child.dev.sessionID(familyCookie).String()
	for _, req := range []struct {
		method, path string
		body         any
	}{
		{http.MethodGet, "/profiles/" + bChild, nil},
		{http.MethodPut, "/profiles/" + bChild, map[string]any{"name": "X", "colour": "red", "avatar": nil, "timezone": "UTC", "contactEmail": nil}},
		{http.MethodDelete, "/profiles/" + bChild, nil},
		{http.MethodPut, "/profiles/" + bChild + "/role", map[string]any{"role": "PARENT"}},
		{http.MethodPut, "/profiles/" + bChild + "/pin", map[string]any{"pin": "000000"}},
		{http.MethodDelete, "/auth/sessions/" + bDevice, nil},
		{http.MethodPost, "/family/owner", map[string]any{"profileId": bChild, "password": testPassword}},
		{http.MethodPost, "/auth/profile-session", map[string]any{"profileId": bChild}},
		{http.MethodGet, "/profiles/" + uuid.NewString(), nil}, // unknown id: same answer
		{http.MethodGet, "/profiles/not-a-uuid", nil},
	} {
		rec := a.owner.dev.do(req.method, req.path, req.body)
		if rec.Code != http.StatusNotFound || !strings.Contains(rec.Body.String(), "not_found") {
			t.Errorf("%s %s = %d %s", req.method, req.path, rec.Code, rec.Body)
		}
	}
	// B is untouched.
	wantStatus(t, b.child.dev.do(http.MethodGet, "/me", nil), http.StatusOK, "")
	wantStatus(t, a.owner.dev.do(http.MethodPut, "/modules/nope", map[string]any{"enabled": true}), http.StatusNotFound, "not_found")
}
