package health_test

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/health"
)

type pingFunc func(context.Context) error

func (f pingFunc) Ping(ctx context.Context) error { return f(ctx) }

// These are unit tests of the handler alone; the tests through the real
// router and a real database live in internal/app.
func TestHealth(t *testing.T) {
	tests := []struct {
		name       string
		ping       pingFunc
		wantStatus int
		check      func(t *testing.T, body []byte)
	}{
		{
			name:       "database reachable",
			ping:       func(context.Context) error { return nil },
			wantStatus: http.StatusOK,
			check: func(t *testing.T, body []byte) {
				t.Helper()
				var got api.Health
				if err := json.Unmarshal(body, &got); err != nil || got.Status != api.HealthStatusOk {
					t.Errorf("body = %s (%v)", body, err)
				}
			},
		},
		{
			name:       "database down",
			ping:       func(context.Context) error { return errors.New("dial tcp: secret-host refused") },
			wantStatus: http.StatusServiceUnavailable,
			check: func(t *testing.T, body []byte) {
				t.Helper()
				var got api.Error
				if err := json.Unmarshal(body, &got); err != nil || got.Error.Code != "service_unavailable" {
					t.Errorf("body = %s (%v)", body, err)
				}
				if strings.Contains(string(body), "secret-host") {
					t.Error("ping error leaked to the client")
				}
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := health.NewHandler(tt.ping, slog.New(slog.DiscardHandler))
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))
			if rec.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			tt.check(t, rec.Body.Bytes())
		})
	}
}

func TestHealthPingHasDeadline(t *testing.T) {
	var hasDeadline bool
	ping := pingFunc(func(ctx context.Context) error {
		_, hasDeadline = ctx.Deadline()
		return nil
	})
	health.NewHandler(ping, slog.New(slog.DiscardHandler)).
		ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if !hasDeadline {
		t.Error("ping must run with a deadline so a hung database cannot hang the probe")
	}
}
