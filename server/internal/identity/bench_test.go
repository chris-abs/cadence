package identity_test

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"
	"time"

	"github.com/chris-abs/cadence/server/internal/identity"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

// Budget 2: session middleware overhead against local Postgres, target
// <= 1 ms p95. Run with:
//
//	go test -run '^$' -bench Middleware -benchmem ./internal/identity/
//
// The clock stands still, so these measure the steady state between the
// once-a-minute renewal writes.
func BenchmarkFamilyMiddleware(b *testing.B) {
	h, signedIn := benchSetup(b)
	mw := h.RequireFamily(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	runMiddlewareBench(b, mw, map[string]string{familyCookie: signedIn.FamilyToken})
}

func BenchmarkProfileMiddleware(b *testing.B) {
	h, signedIn := benchSetup(b)
	mw := h.RequireProfile(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	runMiddlewareBench(b, mw, map[string]string{familyCookie: signedIn.FamilyToken, profileCookie: signedIn.ProfileToken})
}

func benchSetup(b *testing.B) (*identity.Handler, identity.SignedIn) {
	b.Helper()
	clock := testutil.NewClock()
	e := &env{pool: testutil.NewDB(b), clock: clock}
	svc := newService(b, e)
	signedIn, err := svc.Register(b.Context(), identity.RegisterInput{
		Email: "bench@example.com", Password: testPassword, FamilyName: "Bench",
		OwnerName: "Olive", OwnerColour: "teal", OwnerTimezone: "UTC", ClientIP: "10.0.0.1",
	})
	if err != nil {
		b.Fatal(err)
	}
	return identity.NewHandler(svc, identity.HTTPConfig{SecureCookies: true}, slog.New(slog.DiscardHandler)), signedIn
}

func runMiddlewareBench(b *testing.B, h http.Handler, cookies map[string]string) {
	b.Helper()
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	for k, v := range cookies {
		req.AddCookie(&http.Cookie{Name: k, Value: v})
	}
	var durations []time.Duration
	b.ReportAllocs()
	for b.Loop() {
		start := time.Now()
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		durations = append(durations, time.Since(start))
		if rec.Code != http.StatusNoContent {
			b.Fatalf("status %d: %s", rec.Code, rec.Body)
		}
	}
	slices.Sort(durations)
	b.ReportMetric(float64(durations[len(durations)*95/100].Microseconds()), "p95-µs")
}
