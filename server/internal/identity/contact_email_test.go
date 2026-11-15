package identity_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/api"
)

func updateBody(name string, contact any) map[string]any {
	return map[string]any{"name": name, "colour": "rose", "avatar": nil, "timezone": "UTC", "contactEmail": contact}
}

// Abuse 18: contact emails are visible to the profile itself and to PARENTs,
// null for a CHILD viewing someone else, and never in picker data.
func TestContactEmailVisibility(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Vis")
	const parentMail, childMail = "pat@example.com", "kit@example.com"
	wantStatus(t, f.parent.dev.do(http.MethodPut, "/profiles/"+f.parent.id, updateBody("Pat", parentMail)), http.StatusOK, "")
	rec := f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id, updateBody("Kit", childMail))
	wantStatus(t, rec, http.StatusOK, "")
	if p := decode[api.Profile](t, rec); p.ContactEmail == nil || *p.ContactEmail != childMail {
		t.Errorf("PARENT write response contactEmail = %v", p.ContactEmail)
	}

	for _, path := range []string{"/profiles", "/auth/session"} {
		body := f.fsOnly.do(http.MethodGet, path, nil).Body.String()
		if strings.Contains(body, "contactEmail") || strings.Contains(body, "@example.com") {
			t.Errorf("%s leaks contact details: %s", path, body)
		}
	}

	get := func(d *device, id string) *string {
		rec := d.do(http.MethodGet, "/profiles/"+id, nil)
		wantStatus(t, rec, http.StatusOK, "")
		return decode[api.Profile](t, rec).ContactEmail
	}
	if got := get(f.child.dev, f.parent.id); got != nil {
		t.Errorf("CHILD sees another profile's contact email %q", *got)
	}
	if got := get(f.child.dev, f.child.id); got == nil || *got != childMail {
		t.Errorf("CHILD's own contact email = %v", got)
	}
	if got := get(f.parent.dev, f.child.id); got == nil || *got != childMail {
		t.Errorf("PARENT view of child = %v", got)
	}
	if me := decode[api.Me](t, f.child.dev.do(http.MethodGet, "/me", nil)); me.Profile.ContactEmail == nil {
		t.Error("Me must carry the caller's own contact email")
	}
}

// Abuse 19: contact email input rules.
func TestContactEmailInput(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Mail")
	names := map[string]string{f.owner.id: "Olive", f.parent.id: "Pat", f.child.id: "Kit"}
	put := func(d *device, id string, contact any) int {
		return d.do(http.MethodPut, "/profiles/"+id, updateBody(names[id], contact)).Code
	}
	stored := func() (*string, bool) {
		var email *string
		var verified bool
		if err := e.pool.QueryRow(t.Context(), `SELECT contact_email, contact_email_verified_at IS NOT NULL FROM profile WHERE id = $1`, f.child.id).
			Scan(&email, &verified); err != nil {
			t.Fatal(err)
		}
		return email, verified
	}

	if put(f.child.dev, f.child.id, " Sam@Example.COM ") != http.StatusOK {
		t.Fatal("valid contact email refused")
	}
	if got, _ := stored(); got == nil || *got != "sam@example.com" {
		t.Errorf("stored %v, want trimmed and lower-cased", got)
	}
	for _, bad := range []string{"not-an-email", "", "Sam <sam@example.com>", strings.Repeat("a", 243) + "@example.com"} {
		rec := f.child.dev.do(http.MethodPut, "/profiles/"+f.child.id, updateBody("Kit", bad))
		wantStatus(t, rec, http.StatusUnprocessableEntity, "validation_failed")
	}
	// Not unique: another profile, and the family email itself, may share it.
	if put(f.owner.dev, f.parent.id, "sam@example.com") != http.StatusOK ||
		put(f.owner.dev, f.owner.id, f.email) != http.StatusOK {
		t.Error("contact emails need not be unique")
	}
	// A CHILD cannot set someone else's.
	if put(f.child.dev, f.parent.id, "x@example.com") != http.StatusForbidden {
		t.Error("CHILD set another profile's contact email")
	}

	// A change resets verification; resending the same address keeps it.
	if _, err := e.pool.Exec(t.Context(), `UPDATE profile SET contact_email_verified_at = now() WHERE id = $1`, f.child.id); err != nil {
		t.Fatal(err)
	}
	put(f.child.dev, f.child.id, "sam@example.com")
	if _, verified := stored(); !verified {
		t.Error("the same address must keep its verification")
	}
	put(f.child.dev, f.child.id, "new@example.com")
	if _, verified := stored(); verified {
		t.Error("a changed address must lose its verification")
	}
	put(f.child.dev, f.child.id, nil)
	if got, _ := stored(); got != nil {
		t.Errorf("null must clear the contact email, got %q", *got)
	}
}
