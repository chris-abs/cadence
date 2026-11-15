package middleware

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"strings"
	"time"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

type Cookies struct {
	family, profile string
	secure          bool
}

func NewCookies(secure, hostPrefix bool) Cookies {
	prefix := ""
	if hostPrefix {
		prefix = "__Host-"
	}
	return Cookies{family: prefix + "cadence_family", profile: prefix + "cadence_profile", secure: secure}
}

func (c Cookies) Read(r *http.Request) (family, profile string) {
	if ck, err := r.Cookie(c.family); err == nil {
		family = ck.Value
	}
	if ck, err := r.Cookie(c.profile); err == nil {
		profile = ck.Value
	}
	return family, profile
}

func (c Cookies) SetFamily(w http.ResponseWriter, token string, ttl time.Duration) {
	http.SetCookie(w, c.cookie(c.family, token, ttl))
}

func (c Cookies) SetProfile(w http.ResponseWriter, token string, ttl time.Duration) {
	http.SetCookie(w, c.cookie(c.profile, token, ttl))
}

func (c Cookies) ClearProfile(w http.ResponseWriter) { http.SetCookie(w, c.cookie(c.profile, "", 0)) }

func (c Cookies) ClearBoth(w http.ResponseWriter) {
	http.SetCookie(w, c.cookie(c.family, "", 0))
	c.ClearProfile(w)
}

func (c Cookies) cookie(name, value string, ttl time.Duration) *http.Cookie {
	ck := &http.Cookie{ //nolint:gosec // Secure is false only for plain-http localhost development.
		Name:     name,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		Secure:   c.secure,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(ttl / time.Second),
	}
	if ttl == 0 {
		ck.MaxAge = -1
	}
	return ck
}

type Sessions interface {
	AuthenticateDevice(ctx context.Context, token string, passive bool) (models.Device, error)
	AuthenticateProfile(ctx context.Context, familyToken, profileToken string, passive bool) (models.Caller, error)
}

type Auth struct {
	sessions Sessions
	cookies  Cookies
	log      *slog.Logger
}

func NewAuth(sessions Sessions, cookies Cookies, log *slog.Logger) *Auth {
	return &Auth{sessions: sessions, cookies: cookies, log: log}
}

func passive(r *http.Request) bool { return r.Header.Get("X-Cadence-Passive") == "1" }

func (a *Auth) RequireFamily(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs, _ := a.cookies.Read(r)
		d, err := a.sessions.AuthenticateDevice(r.Context(), fs, passive(r))
		if err != nil {
			a.reject(w, r, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(models.WithDevice(r.Context(), d)))
	})
}

func (a *Auth) RequireProfile(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs, ps := a.cookies.Read(r)
		c, err := a.sessions.AuthenticateProfile(r.Context(), fs, ps, passive(r))
		if err != nil {
			a.reject(w, r, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(models.WithCaller(r.Context(), c)))
	})
}

func (a *Auth) reject(w http.ResponseWriter, r *http.Request, err error) {
	fs, ps := a.cookies.Read(r)
	switch {
	case errors.Is(err, models.ErrFamilySessionRequired) && (fs != "" || ps != ""):
		a.cookies.ClearBoth(w)
	case errors.Is(err, models.ErrProfileSessionRequired) && ps != "":
		a.cookies.ClearProfile(w)
	}
	WriteError(w, r, a.log, err)
}

func RequireModule(moduleID string, log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, ok := models.CallerFrom(r.Context())
			switch {
			case !ok:
				logWrite(r, log, httpx.WriteError(w, http.StatusForbidden, httpx.CodeForbidden, "You are not allowed to do that.", nil))
			case !c.ModuleEnabled(moduleID):
				logWrite(r, log, httpx.WriteError(w, http.StatusForbidden, httpx.CodeModuleDisabled, "This module is switched off for your family.", nil))
			default:
				next.ServeHTTP(w, r)
			}
		})
	}
}

func ClientIP(r *http.Request, trusted []netip.Prefix) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	peer, err := netip.ParseAddr(host)
	if err != nil || !fromTrusted(peer, trusted) {
		return host
	}
	xff := r.Header.Values("X-Forwarded-For")
	if len(xff) == 0 {
		return host
	}
	// Only the hop our proxy appended is trustworthy; earlier ones are client-supplied.
	hops := strings.Split(xff[len(xff)-1], ",")
	if last, err := netip.ParseAddr(strings.TrimSpace(hops[len(hops)-1])); err == nil {
		return last.String()
	}
	return host
}

func fromTrusted(addr netip.Addr, trusted []netip.Prefix) bool {
	for _, p := range trusted {
		if p.Contains(addr.Unmap()) {
			return true
		}
	}
	return false
}
