package app_test

import (
	"bytes"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

const contractPath = "../../../api/openapi.yaml"

func buildDev(pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) (http.Handler, error) {
	return app.NewHandler(app.Deps{
		Logger: slog.New(slog.DiscardHandler), DB: pool, Env: app.EnvDevelopment, Now: now, Hasher: hasher, OpenAPIPath: contractPath,
	})
}

func get(h http.Handler, path string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec
}

func TestDocsServeThePageAndContractInDevelopment(t *testing.T) {
	t.Parallel()
	h := testutil.NewServer(t, buildDev).Handler

	page := get(h, "/docs")
	if page.Code != http.StatusOK || !strings.HasPrefix(page.Header().Get("Content-Type"), "text/html") {
		t.Errorf("/docs: status %d, content type %q", page.Code, page.Header().Get("Content-Type"))
	}

	want, err := os.ReadFile(contractPath)
	if err != nil {
		t.Fatal(err)
	}
	spec := get(h, "/docs/openapi.yaml")
	if spec.Code != http.StatusOK || !bytes.Equal(spec.Body.Bytes(), want) {
		t.Errorf("/docs/openapi.yaml: status %d, body matches contract %v", spec.Code, bytes.Equal(spec.Body.Bytes(), want))
	}
}

func TestDocsAreNotMountedInProduction(t *testing.T) {
	t.Parallel()
	h := testutil.NewServer(t, build).Handler
	for _, path := range []string{"/docs", "/docs/openapi.yaml"} {
		if rec := get(h, path); rec.Code != http.StatusNotFound {
			t.Errorf("%s: status %d, want 404", path, rec.Code)
		}
	}
}
