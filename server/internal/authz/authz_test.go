package authz_test

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/authz"
)

var testModule = authz.Module{
	ID: "meals", Name: "Meals", DefaultEnabled: true,
	Actions: []authz.Action{
		{ID: "recipes.edit", Roles: []authz.Role{authz.Parent}},
		{ID: "shopping.tick", Roles: []authz.Role{authz.Parent, authz.Child}},
	},
}

var optIn = authz.Module{ID: "music", Name: "Music", Actions: []authz.Action{{ID: "play", Roles: []authz.Role{authz.Child}}}}

func catalogue(t testing.TB) *authz.Catalogue {
	t.Helper()
	c, err := authz.NewCatalogue(testModule, optIn)
	if err != nil {
		t.Fatal(err)
	}
	return c
}

func TestNewCatalogueRejectsBadEntries(t *testing.T) {
	t.Parallel()
	for name, mods := range map[string][]authz.Module{
		"reserved id":   {{ID: "family"}},
		"bad id":        {{ID: "Meals"}},
		"duplicate":     {{ID: "meals"}, {ID: "meals"}},
		"empty action":  {{ID: "meals", Actions: []authz.Action{{}}}},
		"unknown role":  {{ID: "meals", Actions: []authz.Action{{ID: "x", Roles: []authz.Role{"ADMIN"}}}}},
		"one-char name": {{ID: "m"}},
	} {
		if _, err := authz.NewCatalogue(mods...); err == nil {
			t.Errorf("%s: want an error", name)
		}
	}
}

func TestCan(t *testing.T) {
	t.Parallel()
	c := catalogue(t)
	fam, prof := uuid.New(), uuid.New()
	disabled := []authz.ModuleSetting{{ModuleID: "meals", Enabled: false}}
	musicOn := []authz.ModuleSetting{{ModuleID: "music", Enabled: true}}

	tests := []struct {
		name     string
		role     authz.Role
		owner    bool
		settings []authz.ModuleSetting
		perm     string
		want     bool
	}{
		{"parent edits recipes", authz.Parent, false, nil, "meals.recipes.edit", true},
		{"child cannot edit recipes", authz.Child, false, nil, "meals.recipes.edit", false},
		{"child ticks items", authz.Child, false, nil, "meals.shopping.tick", true},
		{"disabled module grants nothing", authz.Parent, false, disabled, "meals.recipes.edit", false},
		{"opt-in module off by default", authz.Child, false, nil, "music.play", false},
		{"opt-in module enabled", authz.Child, false, musicOn, "music.play", true},
		{"unknown module", authz.Parent, true, nil, "chores.do", false},
		{"unknown action", authz.Parent, true, nil, "meals.nope", false},
		{"no dot", authz.Parent, true, nil, "meals", false},
		{"parent manages sessions", authz.Parent, false, nil, authz.FamilySessionsManage, true},
		{"parent cannot manage account", authz.Parent, false, nil, authz.FamilyAccountManage, false},
		{"parent cannot reset parent pins", authz.Parent, false, nil, authz.FamilyPinsResetParent, false},
		{"owner manages account", authz.Parent, true, nil, authz.FamilyAccountManage, true},
		{"owner resets parent pins", authz.Parent, true, nil, authz.FamilyPinsResetParent, true},
		{"child has no identity rights", authz.Child, false, nil, authz.FamilyView, false},
		{"identity unaffected by modules", authz.Parent, false, disabled, authz.FamilyEdit, true},
	}
	for _, tt := range tests {
		s := c.NewSubject(fam, prof, tt.role, tt.owner, tt.settings)
		if got := s.Can(tt.perm); got != tt.want {
			t.Errorf("%s: Can(%q) = %v, want %v", tt.name, tt.perm, got, tt.want)
		}
	}
}

func TestPermissions(t *testing.T) {
	t.Parallel()
	c := catalogue(t)
	child := c.NewSubject(uuid.New(), uuid.New(), authz.Child, false, nil)
	if got, want := child.Permissions(), []string{"meals.shopping.tick"}; !slices.Equal(got, want) {
		t.Errorf("child = %v, want %v", got, want)
	}
	owner := c.NewSubject(uuid.New(), uuid.New(), authz.Parent, true, nil)
	got := owner.Permissions()
	for _, p := range []string{authz.FamilyAccountManage, authz.FamilyPinsResetParent, "meals.recipes.edit"} {
		if !slices.Contains(got, p) {
			t.Errorf("owner permissions %v lack %s", got, p)
		}
	}
	if !slices.IsSorted(got) {
		t.Error("permissions must be sorted")
	}
	// Every listed permission passes Can, and vice versa for the identity set.
	for _, p := range got {
		if !owner.Can(p) {
			t.Errorf("listed %s but Can is false", p)
		}
	}
	off := c.NewSubject(uuid.New(), uuid.New(), authz.Parent, false, []authz.ModuleSetting{{ModuleID: "meals"}})
	if slices.ContainsFunc(off.Permissions(), func(p string) bool { return p[:6] == "meals." }) {
		t.Error("a disabled module's permissions must not be listed")
	}
	if mods := off.EnabledModules(); len(mods) != 0 {
		t.Errorf("enabled modules = %v", mods)
	}
}

func TestRequire(t *testing.T) {
	t.Parallel()
	c := catalogue(t)
	if err := authz.Require(context.Background(), authz.FamilyView); !errors.Is(err, authz.ErrForbidden) {
		t.Errorf("no subject: %v", err)
	}
	ctx := authz.WithSubject(context.Background(), c.NewSubject(uuid.New(), uuid.New(), authz.Parent, false, nil))
	if err := authz.Require(ctx, authz.FamilyView); err != nil {
		t.Errorf("parent family.view: %v", err)
	}
	if err := authz.Require(ctx, authz.FamilyAccountManage); !errors.Is(err, authz.ErrForbidden) {
		t.Errorf("parent account.manage: %v", err)
	}
}

func TestRequireModule(t *testing.T) {
	t.Parallel()
	c := catalogue(t)
	ok := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) })
	h := authz.RequireModule("meals", slog.New(slog.DiscardHandler))(ok)

	serve := func(ctx context.Context) int {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequestWithContext(ctx, http.MethodGet, "/", nil))
		return rec.Code
	}
	on := authz.WithSubject(context.Background(), c.NewSubject(uuid.New(), uuid.New(), authz.Child, false, nil))
	off := authz.WithSubject(context.Background(), c.NewSubject(uuid.New(), uuid.New(), authz.Child, false,
		[]authz.ModuleSetting{{ModuleID: "meals", Enabled: false}}))
	if got := serve(on); got != http.StatusNoContent {
		t.Errorf("enabled: %d", got)
	}
	if got := serve(off); got != http.StatusForbidden {
		t.Errorf("disabled: %d", got)
	}
	if got := serve(context.Background()); got != http.StatusForbidden {
		t.Errorf("no subject: %d", got)
	}
}

// BenchmarkCan covers the per-request permission check: budget <= 200 ns and
// zero allocations.
func BenchmarkCan(b *testing.B) {
	c := catalogue(b)
	s := c.NewSubject(uuid.New(), uuid.New(), authz.Parent, true, []authz.ModuleSetting{{ModuleID: "music", Enabled: true}})
	for _, perm := range []string{"meals.recipes.edit", authz.FamilyAccountManage, "music.play"} {
		b.Run(perm, func(b *testing.B) {
			b.ReportAllocs()
			for b.Loop() {
				if s.Can(perm) && perm == "music.play" {
					b.Fatal("parent must not play music")
				}
			}
		})
	}
}

func TestCanDoesNotAllocate(t *testing.T) {
	c := catalogue(t)
	s := c.NewSubject(uuid.New(), uuid.New(), authz.Parent, false, []authz.ModuleSetting{{ModuleID: "meals", Enabled: true}})
	if n := testing.AllocsPerRun(100, func() { s.Can("meals.recipes.edit"); s.Can(authz.FamilyEdit) }); n != 0 {
		t.Errorf("Can allocates %.0f times per call", n)
	}
}
