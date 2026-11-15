package app_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

// newTestHandler builds the real router and middleware around db, with a
// low bcrypt cost so tests stay fast.
func newTestHandler(t *testing.T, db *pgxpool.Pool) http.Handler {
	t.Helper()
	h, err := app.NewHandler(app.Deps{
		Logger: slog.New(slog.DiscardHandler), DB: db, Env: app.EnvTest,
		Hasher: passhash.NewBcrypt(bcrypt.MinCost),
	})
	if err != nil {
		t.Fatalf("NewHandler: %v", err)
	}
	return h
}

func TestHealthzOK(t *testing.T) {
	t.Parallel()
	h := newTestHandler(t, testutil.NewDB(t))

	rec := do(h, http.MethodGet, "/api/healthz")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	var got api.Health
	decodeStrict(t, rec, &got)
	if got.Status != api.HealthStatusOk {
		t.Errorf("status field = %q", got.Status)
	}
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Error("security headers missing: middleware not wired")
	}
}

func TestHealthzDatabaseDown(t *testing.T) {
	t.Parallel()
	// A real pool whose server refuses connections: pgxpool.New connects
	// lazily, so the failure surfaces in the handler's ping.
	pool, err := pgxpool.New(t.Context(), "postgres://u:p@127.0.0.1:1/db?sslmode=disable&connect_timeout=1")
	if err != nil {
		t.Fatalf("pgxpool.New: %v", err)
	}
	t.Cleanup(pool.Close)
	h := newTestHandler(t, pool)

	rec := do(h, http.MethodGet, "/api/healthz")

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	var got api.Error
	decodeStrict(t, rec, &got)
	if got.Error.Code != "service_unavailable" || got.Error.Message == "" {
		t.Errorf("error = %+v", got.Error)
	}
}

func TestRouting(t *testing.T) {
	t.Parallel()
	h := newTestHandler(t, testutil.NewDB(t))
	tests := []struct {
		method, path string
		want         int
	}{
		{http.MethodGet, "/api/nope", http.StatusNotFound},
		{http.MethodGet, "/healthz", http.StatusNotFound}, // routes live under /api only
		{http.MethodGet, "/", http.StatusNotFound},
	}
	for _, tt := range tests {
		rec := do(h, tt.method, tt.path)
		if rec.Code != tt.want {
			t.Errorf("%s %s = %d, want %d", tt.method, tt.path, rec.Code, tt.want)
		}
	}
	// Unknown API paths answer in the contract's Error shape.
	var got api.Error
	decodeStrict(t, do(h, http.MethodGet, "/api/nope"), &got)
	if got.Error.Code != "not_found" {
		t.Errorf("code = %q", got.Error.Code)
	}
}

func TestWrongMethodIs405InErrorShape(t *testing.T) {
	t.Parallel()
	h := newTestHandler(t, testutil.NewDB(t))
	for _, tt := range []struct{ method, path, allow string }{
		{http.MethodPost, "/api/healthz", "GET, HEAD"},
		{http.MethodPatch, "/api/profiles", "GET, HEAD, POST"},
		{http.MethodGet, "/api/auth/login", "POST"},
	} {
		rec := do(h, tt.method, tt.path)
		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s %s = %d, want 405", tt.method, tt.path, rec.Code)
			continue
		}
		if got := rec.Header().Get("Allow"); got != tt.allow {
			t.Errorf("%s %s Allow = %q, want %q", tt.method, tt.path, got, tt.allow)
		}
		var body api.Error
		decodeStrict(t, rec, &body)
		if body.Error.Code != "method_not_allowed" {
			t.Errorf("code = %q", body.Error.Code)
		}
	}
}

func TestNonJSONBodyIs415(t *testing.T) {
	t.Parallel()
	h := newTestHandler(t, testutil.NewDB(t))
	// Even an endpoint that takes no body refuses a form-encoded one.
	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", strings.NewReader("a=b"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("status = %d", rec.Code)
	}
	var body api.Error
	decodeStrict(t, rec, &body)
	if body.Error.Code != "unsupported_media_type" {
		t.Errorf("code = %q", body.Error.Code)
	}
}

// TestCrossOriginPostIsRefused is abuse case 15.
func TestCrossOriginPostIsRefused(t *testing.T) {
	t.Parallel()
	h := newTestHandler(t, testutil.NewDB(t))
	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d", rec.Code)
	}
	var body api.Error
	decodeStrict(t, rec, &body)
	if body.Error.Code != "cross_origin" {
		t.Errorf("code = %q", body.Error.Code)
	}
	// Same-origin requests pass.
	req = httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Errorf("same-origin logout = %d", rec.Code)
	}
}

func do(h http.Handler, method, path string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(method, path, nil))
	return rec
}

func decodeStrict(t *testing.T, rec *httptest.ResponseRecorder, dst any) {
	t.Helper()
	dec := json.NewDecoder(bytes.NewReader(rec.Body.Bytes()))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		t.Fatalf("body %q does not match %T: %v", rec.Body, dst, err)
	}
}
