package app

import (
	"log/slog"
	"net/http"

	"github.com/chris-abs/cadence/server/internal/health"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

// Deps are the long-lived dependencies handlers are built from. main
// constructs them once; tests pass real or fake ones.
type Deps struct {
	Logger *slog.Logger
	DB     health.Pinger
	Env    Env
}

// NewHandler builds the full HTTP handler: middleware around the router.
func NewHandler(d Deps) http.Handler {
	// Routes are registered relative to /api, matching the contract's
	// `servers: [{url: /api}]`, so paths here read exactly like openapi.yaml.
	api := http.NewServeMux()
	api.Handle("GET /healthz", health.NewHandler(d.DB, d.Logger))
	api.HandleFunc("/", notFound(d.Logger))

	root := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", api))

	return chain(root,
		securityHeaders(d.Env),
		logRequests(d.Logger),
		recoverPanic(d.Logger),
		limitBody(httpx.DefaultMaxBodyBytes),
	)
}

// notFound answers unknown /api paths in the contract's Error shape instead of
// ServeMux's plain-text 404, so the client has one error format to parse.
func notFound(logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := httpx.WriteError(w, http.StatusNotFound, httpx.CodeNotFound, "No such endpoint.", nil); err != nil {
			logger.ErrorContext(r.Context(), "write not found response", "err", err)
		}
	}
}
