package identity_test

import (
	"net/http"
	"strings"
	"testing"
)

// §6.4: audit events are logged with ids only; no email, password, PIN or
// token ever reaches the log.
func TestAuditLogHasEventsAndNoSecrets(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	f := e.newFamily("Audit")
	const pin, newPassword = "975310", "an entirely new secret"
	wantStatus(t, f.owner.dev.do(http.MethodPut, "/profiles/"+f.child.id+"/pin", map[string]any{"pin": pin}), http.StatusNoContent, "")
	selectWithPIN(f.fsOnly, f.child.id, "000000")
	wantStatus(t, selectWithPIN(f.fsOnly, f.child.id, pin), http.StatusOK, "")
	e.device().do(http.MethodPost, "/auth/login", map[string]any{"email": f.email, "password": "wrong password"})
	wantStatus(t, f.owner.dev.do(http.MethodPut, "/family/password", map[string]any{"currentPassword": testPassword, "newPassword": newPassword}),
		http.StatusNoContent, "")
	wantStatus(t, f.owner.dev.do(http.MethodPut, "/family/email", map[string]any{"email": "moved@example.com", "password": newPassword}),
		http.StatusOK, "")
	f.owner.dev.do(http.MethodPost, "/auth/logout", nil)

	logs := e.logs.String()
	for _, event := range []string{
		"family.registered", "auth.login_succeeded", "auth.login_failed", "profile.created", "profile.selected",
		"profile.pin_changed", "profile.pin_failed", "family.password_changed", "family.email_changed", "auth.logout",
	} {
		if !strings.Contains(logs, "event="+event) {
			t.Errorf("no %s event logged", event)
		}
	}
	secrets := []string{f.email, "moved@example.com", testPassword, newPassword, pin}
	for _, d := range []*device{f.owner.dev, f.parent.dev, f.child.dev, f.fsOnly} {
		for _, v := range d.cookies {
			secrets = append(secrets, v)
		}
	}
	for _, s := range secrets {
		if s != "" && strings.Contains(logs, s) {
			t.Errorf("log contains a secret or email: %q", s)
		}
	}
}
