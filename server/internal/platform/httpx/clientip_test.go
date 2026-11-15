package httpx_test

import (
	"net/http"
	"net/http/httptest"
	"net/netip"
	"testing"

	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

func TestClientIPTrustsOnlyTheProxysOwnHop(t *testing.T) {
	t.Parallel()
	proxy := []netip.Prefix{netip.MustParsePrefix("10.0.0.0/8")}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.1.2.3:5000"
	req.Header.Add("X-Forwarded-For", "6.6.6.6, 203.0.113.9")
	if got := httpx.ClientIP(req, proxy); got != "203.0.113.9" {
		t.Errorf("behind trusted proxy: %s", got)
	}
	if got := httpx.ClientIP(req, nil); got != "10.1.2.3" {
		t.Errorf("untrusted peer: %s", got)
	}
}
