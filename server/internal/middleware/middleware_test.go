package middleware_test

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"strings"
	"testing"
	"time"

	"github.com/chris-abs/cadence/server/internal/middleware"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
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

func TestClientIPTrustsOnlyTheProxysOwnHop(t *testing.T) {
	t.Parallel()
	proxy := []netip.Prefix{netip.MustParsePrefix("10.0.0.0/8")}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.1.2.3:5000"
	req.Header.Add("X-Forwarded-For", "6.6.6.6, 203.0.113.9")
	if got := middleware.ClientIP(req, proxy); got != "203.0.113.9" {
		t.Errorf("behind trusted proxy: %s", got)
	}
	if got := middleware.ClientIP(req, nil); got != "10.1.2.3" {
		t.Errorf("untrusted peer: %s", got)
	}
}

func TestRateLimiter(t *testing.T) {
	t.Parallel()
	clock := testutil.NewClock()
	l := middleware.NewRateLimiter(time.Minute, 2, clock.Now)
	l.Allow("k")
	l.Allow("k")
	if ok, wait := l.Allow("k"); ok || wait != time.Minute {
		t.Errorf("third in burst: %v %s", ok, wait)
	}
	if ok, _ := l.Allow("other"); !ok {
		t.Error("keys must not share a bucket")
	}
	clock.Advance(time.Minute)
	if ok, _ := l.Allow("k"); !ok {
		t.Error("no refill after the interval")
	}
	if ok, _ := l.Check("f"); !ok {
		t.Error("Check must not spend")
	}
	l.Fail("f")
	l.Fail("f")
	if ok, _ := l.Check("f"); ok {
		t.Error("Check after two failures")
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
