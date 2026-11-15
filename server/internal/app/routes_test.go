package app_test

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

func build(pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) (http.Handler, error) {
	return app.NewHandler(app.Deps{Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvProduction, Now: now, Hasher: hasher})
}

func TestHealthz(t *testing.T) {
	t.Parallel()
	srv := testutil.NewServer(t, build)
	d := srv.Device(t)
	d.Call(http.MethodGet, "/healthz", nil, http.StatusOK)
	srv.Pool.Close()
	d.Expect(d.Do(http.MethodGet, "/healthz", nil), http.StatusServiceUnavailable, httpx.CodeUnavailable)
}

func TestEveryResponseCarriesSecurityHeaders(t *testing.T) {
	t.Parallel()
	rec := testutil.NewServer(t, build).Device(t).Do(http.MethodGet, "/nope", nil)
	for _, h := range []string{"X-Content-Type-Options", "X-Frame-Options", "Content-Security-Policy", "Cache-Control", "Strict-Transport-Security"} {
		if rec.Header().Get(h) == "" {
			t.Errorf("missing %s", h)
		}
	}
}

func TestUnmatchedRequestsUseErrorShape(t *testing.T) {
	t.Parallel()
	d := testutil.NewServer(t, build).Device(t)
	d.Expect(d.Do(http.MethodGet, "/nope", nil), http.StatusNotFound, httpx.CodeNotFound)
	rec := d.Do(http.MethodDelete, "/healthz", nil)
	d.Expect(rec, http.StatusMethodNotAllowed, httpx.CodeMethodNotAllowed)
	if rec.Header().Get("Allow") == "" {
		t.Error("405 without Allow header")
	}
}

func TestFormBodiesAndCrossOriginWritesAreRefused(t *testing.T) {
	t.Parallel()
	srv := testutil.NewServer(t, build)
	d := srv.Device(t)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", strings.NewReader("a=b"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	srv.Handler.ServeHTTP(rec, req)
	d.Expect(rec, http.StatusUnsupportedMediaType, httpx.CodeUnsupportedMedia)

	d.Header.Set("Sec-Fetch-Site", "cross-site")
	d.Expect(d.Do(http.MethodPost, "/auth/logout", nil), http.StatusForbidden, httpx.CodeCrossOrigin)
}
