package identity_test

import (
	"errors"
	"log/slog"
	"net/http"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity"
	"github.com/chris-abs/cadence/server/internal/meals"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
)

// probeRouter mounts the identity routes plus a stand-in for the first
// feature-module route, wired exactly as a module will be: profile
// middleware, then RequireModule, then authz.Require in the handler.
func probeRouter(t *testing.T, e *env) http.Handler {
	t.Helper()
	cat, err := authz.NewCatalogue(meals.Module)
	if err != nil {
		t.Fatal(err)
	}
	logger := slog.New(slog.DiscardHandler)
	svc, err := identity.NewService(identity.Deps{
		Pool: e.pool, Logger: logger, Catalogue: cat, Hasher: passhash.NewBcrypt(bcrypt.MinCost),
		Tokens: identity.NewTokenSource(nil), Now: e.clock.Now, Registration: identity.RegistrationOpen,
	})
	if err != nil {
		t.Fatal(err)
	}
	ident := identity.NewHandler(svc, identity.HTTPConfig{SecureCookies: true}, logger)
	mux := http.NewServeMux()
	for _, r := range ident.Routes() {
		mux.Handle(r.Pattern, r.Handler)
	}
	editRecipe := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := authz.Require(r.Context(), "meals.recipes.edit"); errors.Is(err, authz.ErrForbidden) {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		s, _ := authz.SubjectFrom(r.Context())
		c, ok := identity.CallerFrom(r.Context())
		if !ok || c.Profile.ID != s.ProfileID || c.Family.ID != s.FamilyID || c.Profile.Role != s.Role || c.Profile.Timezone == "" {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
	mux.Handle("PUT /meals/recipes/x", ident.RequireProfile(authz.RequireModule("meals", logger)(editRecipe)))
	return http.StripPrefix("/api", mux)
}

// Abuse 16: a disabled module's routes answer 403 module_disabled; enabled
// again, they work; inside, authz.Require applies role rights.
func TestModuleGate(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	h := probeRouter(t, e)
	f := e.newFamily("Mods")
	parent, child := f.parent.dev.with(f.parent.dev.cookies), f.child.dev.with(f.child.dev.cookies)
	parent.h, child.h = h, h
	owner := f.owner.dev.with(f.owner.dev.cookies)
	owner.h = h

	wantStatus(t, parent.do(http.MethodPut, "/meals/recipes/x", nil), http.StatusNoContent, "")
	wantStatus(t, child.do(http.MethodPut, "/meals/recipes/x", nil), http.StatusForbidden, "")

	rec := owner.do(http.MethodPut, "/modules/meals", map[string]any{"enabled": false})
	wantStatus(t, rec, http.StatusOK, "")
	if m := decode[api.Module](t, rec); m.Enabled {
		t.Error("module still enabled")
	}
	wantStatus(t, parent.do(http.MethodPut, "/meals/recipes/x", nil), http.StatusForbidden, "module_disabled")
	if mods := decode[api.ModuleList](t, parent.do(http.MethodGet, "/modules", nil)); len(mods.Modules) != 1 || mods.Modules[0].Enabled {
		t.Errorf("modules = %+v", mods)
	}
	if me := decode[api.Me](t, parent.do(http.MethodGet, "/me", nil)); len(me.Modules) != 0 {
		t.Errorf("Me.modules lists a disabled module: %+v", me.Modules)
	}

	wantStatus(t, owner.do(http.MethodPut, "/modules/meals", map[string]any{"enabled": true}), http.StatusOK, "")
	wantStatus(t, parent.do(http.MethodPut, "/meals/recipes/x", nil), http.StatusNoContent, "")

	// Without a profile session the module route is a 401, like any other.
	wantStatus(t, f.fsOnly.with(f.fsOnly.cookies).do(http.MethodGet, "/me", nil), http.StatusUnauthorized, "profile_session_required")
}
