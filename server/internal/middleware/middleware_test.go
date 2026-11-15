package middleware_test

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/middleware"
	"github.com/chris-abs/cadence/server/internal/models"
)

func TestRequireModule(t *testing.T) {
	t.Parallel()
	guarded := middleware.RequireModule("meals", slog.New(slog.DiscardHandler))(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	meals := models.Module{ID: "meals"}
	for _, tt := range []struct {
		name   string
		caller *models.Caller
		want   int
		code   string
	}{
		{"enabled", &models.Caller{Modules: []models.Module{meals}}, http.StatusNoContent, ""},
		{"disabled", &models.Caller{}, http.StatusForbidden, "module_disabled"},
		{"no caller", nil, http.StatusForbidden, "forbidden"},
	} {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		if tt.caller != nil {
			req = req.WithContext(models.WithCaller(req.Context(), *tt.caller))
		}
		rec := httptest.NewRecorder()
		guarded.ServeHTTP(rec, req)
		if rec.Code != tt.want || !strings.Contains(rec.Body.String(), tt.code) {
			t.Errorf("%s: %d %s", tt.name, rec.Code, rec.Body)
		}
	}
}

func TestRecoverPanic(t *testing.T) {
	t.Parallel()
	h := middleware.RecoverPanic(slog.New(slog.DiscardHandler))(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		panic("boom")
	}))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusInternalServerError || strings.Contains(rec.Body.String(), "boom") {
		t.Errorf("%d %s", rec.Code, rec.Body)
	}
}
