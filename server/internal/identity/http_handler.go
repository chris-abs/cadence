package identity

import (
	"context"
	"log/slog"
	"net/http"
	"net/netip"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

// HTTPConfig is the HTTP-facing part of identity's configuration.
type HTTPConfig struct {
	// SecureCookies is false only in development (plain-http localhost).
	SecureCookies bool
	// HostPrefixCookies names the cookies __Host-… (production).
	HostPrefixCookies bool
	// TrustedProxies may set X-Forwarded-For (hosting, M5). Empty: RemoteAddr only.
	TrustedProxies []netip.Prefix
}

// Handler serves the identity endpoints and provides the session middleware
// feature modules wrap their routes in.
type Handler struct {
	svc     *Service
	cookies cookieJar
	proxies []netip.Prefix
	logger  *slog.Logger
	audit   auditor
}

// NewHandler returns the identity HTTP handler.
func NewHandler(svc *Service, cfg HTTPConfig, logger *slog.Logger) *Handler {
	return &Handler{svc: svc, cookies: newCookieJar(cfg), proxies: cfg.TrustedProxies, logger: logger, audit: auditor{logger: logger}}
}

// Route is one pattern for the /api mux, relative to /api.
type Route struct {
	Pattern string
	Handler http.Handler
}

// Routes lists every identity endpoint of the contract.
func (h *Handler) Routes() []Route {
	return []Route{
		{"GET /auth/registration", h.public(h.registrationStatus)},
		{"POST /auth/register", h.public(h.register)},
		{"POST /auth/login", h.public(h.login)},
		{"POST /auth/logout", h.public(h.logout)},
		{"GET /auth/session", h.family(h.familySession)},
		{"POST /auth/profile-session", h.family(h.selectProfile)},
		{"DELETE /auth/profile-session", h.family(h.lockProfile)},
		{"GET /auth/sessions", h.profile(h.listSessions)},
		{"DELETE /auth/sessions/{sessionId}", h.profile(h.revokeSession)},
		{"POST /auth/sessions/revoke-others", h.profile(h.revokeOtherSessions)},
		{"GET /me", h.profile(h.me)},
		{"GET /family", h.profile(h.getFamily)},
		{"PUT /family", h.profile(h.updateFamily)},
		{"PUT /family/email", h.profile(h.changeEmail)},
		{"PUT /family/password", h.profile(h.changePassword)},
		{"POST /family/owner", h.profile(h.transferOwnership)},
		{"POST /family/delete", h.profile(h.deleteFamily)},
		{"GET /profiles", h.family(h.listProfiles)},
		{"POST /profiles", h.profile(h.createProfile)},
		{"GET /profiles/{profileId}", h.profile(h.getProfile)},
		{"PUT /profiles/{profileId}", h.profile(h.updateProfile)},
		{"DELETE /profiles/{profileId}", h.profile(h.deleteProfile)},
		{"PUT /profiles/{profileId}/role", h.profile(h.changeRole)},
		{"PUT /profiles/{profileId}/pin", h.profile(h.setPin)},
		{"GET /modules", h.profile(h.listModules)},
		{"PUT /modules/{moduleId}", h.profile(h.setModuleEnabled)},
	}
}

// Handler shapes: each returns an error that writeError maps to the
// contract, so handlers never write error responses themselves.
type (
	publicFunc  func(http.ResponseWriter, *http.Request) error
	familyFunc  func(http.ResponseWriter, *http.Request, deviceSession) error
	profileFunc func(http.ResponseWriter, *http.Request, callerSession) error
)

func (h *Handler) public(fn publicFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.finish(w, r, fn(w, r))
	})
}

func (h *Handler) family(fn familyFunc) http.Handler {
	return h.RequireFamily(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		d, _ := r.Context().Value(deviceKey{}).(deviceSession)
		h.finish(w, r, fn(w, r, d))
	}))
}

func (h *Handler) profile(fn profileFunc) http.Handler {
	return h.RequireProfile(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, _ := r.Context().Value(callerKey{}).(callerSession)
		h.finish(w, r, fn(w, r, c))
	}))
}

func (h *Handler) finish(w http.ResponseWriter, r *http.Request, err error) {
	if err != nil {
		h.writeError(w, r, err)
	}
}

type (
	deviceKey struct{}
	callerKey struct{}
)

// CallerFrom returns the profile-session caller RequireProfile stored: ids,
// role, display name and time zone of the profile and its family. Modules that
// need only ids and permission checks can use authz.SubjectFrom instead.
func CallerFrom(ctx context.Context) (Caller, bool) {
	c, ok := ctx.Value(callerKey{}).(callerSession)
	if !ok {
		return Caller{}, false
	}
	return c.public(), true
}

// passive reports X-Cadence-Passive: 1, background polling that must not
// renew sessions (spec §3).
func passive(r *http.Request) bool { return r.Header.Get("X-Cadence-Passive") == "1" }

// RequireFamily admits requests with a valid family session (FS) cookie.
func (h *Handler) RequireFamily(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs, _ := h.cookies.read(r)
		d, err := h.svc.authenticateDevice(r.Context(), fs, passive(r))
		if err != nil {
			h.writeError(w, r, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), deviceKey{}, d)))
	})
}

// RequireProfile admits requests with a valid profile session on its own
// device's family session, and stores the callerSession and its authz.Subject in the
// context. Every feature-module route sits behind it.
func (h *Handler) RequireProfile(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs, ps := h.cookies.read(r)
		c, err := h.svc.authenticateProfile(r.Context(), fs, ps, passive(r))
		if err != nil {
			h.writeError(w, r, err)
			return
		}
		ctx := context.WithValue(r.Context(), callerKey{}, c)
		next.ServeHTTP(w, r.WithContext(authz.WithSubject(ctx, c.Subject)))
	})
}

// CrossOriginDenied answers requests http.CrossOriginProtection rejects.
func (h *Handler) CrossOriginDenied(w http.ResponseWriter, r *http.Request) {
	h.audit.event(r.Context(), evCrossOriginBlocked, slog.String("method", r.Method), slog.String("path", r.URL.Path))
	h.logWrite(r, httpx.WriteError(w, http.StatusForbidden, httpx.CodeCrossOrigin, "Cross-origin requests are not allowed.", nil))
}

// pathID parses a path id. A malformed id cannot exist, so it is not found.
func pathID(r *http.Request, name string) (uuid.UUID, error) {
	id, err := uuid.Parse(r.PathValue(name))
	if err != nil {
		return uuid.UUID{}, ErrNotFound
	}
	return id, nil
}

func (h *Handler) clientIP(r *http.Request) string { return clientIP(r, h.proxies) }

func (h *Handler) logWrite(r *http.Request, err error) {
	if err != nil {
		h.logger.ErrorContext(r.Context(), "write response", "err", err)
	}
}

// writeJSON writes a success body, logging (not returning) a write failure:
// once headers are out there is nothing better to tell the client.
func (h *Handler) writeJSON(w http.ResponseWriter, r *http.Request, status int, v any) error {
	h.logWrite(r, httpx.WriteJSON(w, status, v))
	return nil
}

func noContent(w http.ResponseWriter) error {
	w.WriteHeader(http.StatusNoContent)
	return nil
}
