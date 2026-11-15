package app

import (
	"context"
	"crypto/rand"
	"fmt"
	"log/slog"
	"net/http"
	"net/netip"
	"slices"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/health"
	"github.com/chris-abs/cadence/server/internal/identity"
	"github.com/chris-abs/cadence/server/internal/meals"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
)

// Deps are the long-lived dependencies handlers are built from. main
// constructs them once; tests pass real or fake ones.
type Deps struct {
	Logger         *slog.Logger
	DB             *pgxpool.Pool
	Env            Env
	Registration   identity.RegistrationMode
	TrustedProxies []netip.Prefix

	// Now is the clock; nil means time.Now. Tests inject a fake one.
	Now func() time.Time
	// Hasher hashes passwords and PINs; nil means bcrypt at
	// passhash.DefaultCost. Tests inject a low cost, never production.
	Hasher passhash.Hasher
}

// Handler is the whole HTTP API plus the background work that belongs to it.
type Handler struct {
	http.Handler
	patterns []string
	identity *identity.Service
}

// Patterns lists every registered /api route pattern (relative to /api), for
// the authorisation matrix's coverage check.
func (h *Handler) Patterns() []string { return slices.Clone(h.patterns) }

// RunCleanup sweeps expired sessions hourly until ctx is cancelled.
func (h *Handler) RunCleanup(ctx context.Context) {
	h.identity.RunCleanup(ctx, identity.CleanupInterval)
}

// catalogue is the v1 module catalogue. A new module adds its exported authz.Module
// here and wraps its routes in identity's RequireProfile and
// authz.RequireModule.
func catalogue() (*authz.Catalogue, error) {
	return authz.NewCatalogue(meals.Module)
}

// NewHandler builds the full HTTP handler: middleware around the router. The
// catalogue and the identity service are built once here, never per request.
func NewHandler(d Deps) (*Handler, error) {
	if d.Now == nil {
		d.Now = time.Now
	}
	if d.Hasher == nil {
		d.Hasher = passhash.NewBcrypt(passhash.DefaultCost)
	}
	if d.Registration == "" {
		d.Registration = identity.RegistrationFirst
	}
	cat, err := catalogue()
	if err != nil {
		return nil, err
	}
	svc, err := identity.NewService(identity.Deps{
		Pool: d.DB, Logger: d.Logger, Catalogue: cat, Hasher: d.Hasher,
		Tokens: identity.NewTokenSource(rand.Reader), Now: d.Now, Registration: d.Registration,
	})
	if err != nil {
		return nil, fmt.Errorf("build identity service: %w", err)
	}
	ident := identity.NewHandler(svc, identity.HTTPConfig{
		SecureCookies:     d.Env != EnvDevelopment,
		HostPrefixCookies: d.Env == EnvProduction,
		TrustedProxies:    d.TrustedProxies,
	}, d.Logger)

	// Routes are registered relative to /api, matching the contract's
	// `servers: [{url: /api}]`, so paths here read exactly like openapi.yaml.
	routes := []identity.Route{{Pattern: "GET /healthz", Handler: health.NewHandler(d.DB, d.Logger)}}
	routes = append(routes, ident.Routes()...)

	api := http.NewServeMux()
	patterns := make([]string, 0, len(routes))
	for _, rt := range routes {
		api.Handle(rt.Pattern, rt.Handler)
		patterns = append(patterns, rt.Pattern)
	}

	// Defence in depth on top of SameSite=Strict cookies (spec §3): refuse
	// cross-origin unsafe requests and non-JSON bodies before any handler runs.
	cop := http.NewCrossOriginProtection()
	cop.SetDenyHandler(http.HandlerFunc(ident.CrossOriginDenied))
	apiHandler := cop.Handler(requireJSONBody(d.Logger)(errorShapedFallbacks(api, d.Logger)))

	root := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", apiHandler))

	return &Handler{
		Handler: chain(root,
			securityHeaders(d.Env),
			logRequests(d.Logger),
			recoverPanic(d.Logger),
			limitBody(httpx.DefaultMaxBodyBytes),
		),
		patterns: patterns,
		identity: svc,
	}, nil
}
