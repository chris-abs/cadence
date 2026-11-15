package identity

import (
	"net/http"
	"time"
)

// cookieJar names and writes the two session cookies (spec §3). Outside
// development they carry the __Host- prefix, which browsers accept only with
// Secure, Path=/ and no Domain, pinning the cookie to this exact origin.
type cookieJar struct {
	family, profile string
	secure          bool
}

func newCookieJar(cfg HTTPConfig) cookieJar {
	prefix := ""
	if cfg.HostPrefixCookies {
		prefix = "__Host-"
	}
	return cookieJar{family: prefix + "cadence_family", profile: prefix + "cadence_profile", secure: cfg.SecureCookies}
}

// read returns the raw cookie values; empty when absent.
func (c cookieJar) read(r *http.Request) (family, profile string) {
	if ck, err := r.Cookie(c.family); err == nil {
		family = ck.Value
	}
	if ck, err := r.Cookie(c.profile); err == nil {
		profile = ck.Value
	}
	return family, profile
}

func (c cookieJar) setFamily(w http.ResponseWriter, token string) {
	http.SetCookie(w, c.cookie(c.family, token, FamilyAbsoluteTimeout))
}

func (c cookieJar) setProfile(w http.ResponseWriter, token string) {
	http.SetCookie(w, c.cookie(c.profile, token, ProfileAbsoluteTimeout))
}

func (c cookieJar) clearFamily(w http.ResponseWriter)  { http.SetCookie(w, c.cookie(c.family, "", 0)) }
func (c cookieJar) clearProfile(w http.ResponseWriter) { http.SetCookie(w, c.cookie(c.profile, "", 0)) }

func (c cookieJar) clearBoth(w http.ResponseWriter) {
	c.clearFamily(w)
	c.clearProfile(w)
}

// cookie builds a session cookie. maxAge 0 deletes it (sent as Max-Age=0).
func (c cookieJar) cookie(name, value string, maxAge time.Duration) *http.Cookie {
	ck := &http.Cookie{ //nolint:gosec // Secure is false only in development (plain-http localhost), per spec §3.
		Name:     name,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		Secure:   c.secure,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(maxAge / time.Second),
	}
	if maxAge == 0 {
		ck.MaxAge = -1 // net/http writes Max-Age=0 for negative values
	}
	return ck
}
