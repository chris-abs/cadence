package identity

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"strings"
	"testing"
	"time"
)

func TestLockoutSchedule(t *testing.T) {
	t.Parallel()
	want := map[int32]time.Duration{1: 0, 4: 0, 5: 30 * time.Second, 6: time.Minute, 7: 5 * time.Minute, 8: 15 * time.Minute, 9: time.Hour, 50: time.Hour}
	for n, d := range want {
		if got := lockoutAfter(n); got != d {
			t.Errorf("lockoutAfter(%d) = %s, want %s", n, got, d)
		}
	}
}

func TestTokens(t *testing.T) {
	t.Parallel()
	src := NewTokenSource(bytes.NewReader(bytes.Repeat([]byte{7}, 64)))
	token, hash, err := src.New()
	if err != nil {
		t.Fatal(err)
	}
	if got, ok := hashToken(token); !ok || !bytes.Equal(got, hash) {
		t.Error("a minted token must hash to its stored hash")
	}
	for _, bad := range []string{"", "short", token + "A", strings.Repeat("!", len(token))} {
		if _, ok := hashToken(bad); ok {
			t.Errorf("hashToken(%q) accepted", bad)
		}
	}
	if _, _, err := NewTokenSource(bytes.NewReader(nil)).New(); err == nil {
		t.Error("an exhausted random source must be an error")
	}
}

func TestCookieNames(t *testing.T) {
	t.Parallel()
	prod := newCookieJar(HTTPConfig{SecureCookies: true, HostPrefixCookies: true})
	if prod.family != "__Host-cadence_family" || prod.profile != "__Host-cadence_profile" || !prod.secure {
		t.Errorf("production jar = %+v", prod)
	}
	dev := newCookieJar(HTTPConfig{})
	if dev.family != "cadence_family" || dev.secure {
		t.Errorf("development jar = %+v", dev)
	}
	rec := httptest.NewRecorder()
	prod.clearProfile(rec)
	if h := rec.Header().Get("Set-Cookie"); !strings.Contains(h, "Max-Age=0") || !strings.Contains(h, "__Host-cadence_profile=;") {
		t.Errorf("clear cookie = %q", h)
	}
}

func TestClientIP(t *testing.T) {
	t.Parallel()
	proxies := []netip.Prefix{netip.MustParsePrefix("10.0.0.0/8")}
	tests := []struct {
		remote, xff string
		trusted     []netip.Prefix
		want        string
	}{
		{"192.0.2.1:1234", "", nil, "192.0.2.1"},
		{"192.0.2.1:1234", "203.0.113.9", nil, "192.0.2.1"},                    // untrusted peer: header ignored
		{"10.1.2.3:1234", "198.51.100.1, 203.0.113.9", proxies, "203.0.113.9"}, // last hop only
		{"10.1.2.3:1234", "garbage", proxies, "10.1.2.3"},
		{"[2001:db8::1]:443", "", nil, "2001:db8::1"},
	}
	for _, tt := range tests {
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.RemoteAddr = tt.remote
		if tt.xff != "" {
			r.Header.Set("X-Forwarded-For", tt.xff)
		}
		if got := clientIP(r, tt.trusted); got != tt.want {
			t.Errorf("clientIP(%s, %q) = %s, want %s", tt.remote, tt.xff, got, tt.want)
		}
	}
}

func TestValidators(t *testing.T) {
	t.Parallel()
	if e, msg := normalizeEmail("  Ada@Example.COM "); msg != "" || e != "ada@example.com" {
		t.Errorf("normalizeEmail = %q %q", e, msg)
	}
	for _, bad := range []string{"", "ada", "Ada <ada@example.com>", "ada@example.com, bob@example.com", strings.Repeat("a", 250) + "@x.io"} {
		if _, msg := normalizeEmail(bad); msg == "" {
			t.Errorf("normalizeEmail(%q) accepted", bad)
		}
	}
	for pw, ok := range map[string]bool{
		"123456789": false, "1234567890": true, strings.Repeat("a", 72): true, strings.Repeat("a", 73): false,
		strings.Repeat("é", 36): true, strings.Repeat("é", 37): false,
	} {
		if got := checkPassword(pw) == ""; got != ok {
			t.Errorf("checkPassword(%d bytes, %d chars) ok = %v", len(pw), len([]rune(pw)), got)
		}
	}
	for pin, ok := range map[string]bool{"123456": true, "12345": false, "1234567": false, "12345a": false, "١٢٣٤٥٦": false} {
		if got := checkPIN(pin) == ""; got != ok {
			t.Errorf("checkPIN(%q) ok = %v", pin, got)
		}
	}
	for tz, ok := range map[string]bool{"Europe/London": true, "UTC": true, "": false, "Local": false, "Mars/Base": false} {
		if got := checkTimezone(tz) == ""; got != ok {
			t.Errorf("checkTimezone(%q) ok = %v", tz, got)
		}
	}
	if ua := truncateUserAgent(strings.Repeat("ü", 300)); ua == nil || len([]rune(*ua)) != 256 {
		t.Error("user agent must be truncated to 256 characters")
	}
	if name, msg := normalizeDeviceName(ptr("  ")); name != nil || msg != "" {
		t.Error("a blank device name means none")
	}
}

func ptr(s string) *string { return &s }
