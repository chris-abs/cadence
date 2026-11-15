// Package health serves GET /api/healthz: the process is up and can reach its
// database.
package health

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

// pingTimeout keeps the check fast enough for load-balancer probes even when
// the database hangs rather than refusing connections.
const pingTimeout = 2 * time.Second

// Pinger is the one thing health needs from the database; *pgxpool.Pool
// satisfies it.
type Pinger interface {
	Ping(ctx context.Context) error
}

// Handler answers the health check.
type Handler struct {
	db     Pinger
	logger *slog.Logger
}

// NewHandler returns a health Handler.
func NewHandler(db Pinger, logger *slog.Logger) *Handler {
	return &Handler{db: db, logger: logger}
}

// Routes is the health endpoint for the /api mux.
func (h *Handler) Routes() []httpx.Route {
	return []httpx.Route{{Pattern: "GET /healthz", Handler: h}}
}

// ServeHTTP implements GET /api/healthz per api/openapi.yaml (getHealth).
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), pingTimeout)
	defer cancel()

	if err := h.db.Ping(ctx); err != nil {
		// The cause goes to the log only; it may name hosts or users.
		h.logger.WarnContext(r.Context(), "health check: database ping failed", "err", err)
		h.logWriteErr(r, httpx.WriteError(w, http.StatusServiceUnavailable, httpx.CodeUnavailable,
			"The service cannot reach its database.", nil))
		return
	}
	h.logWriteErr(r, httpx.WriteJSON(w, http.StatusOK, api.Health{Status: api.HealthStatusOk}))
}

func (h *Handler) logWriteErr(r *http.Request, err error) {
	if err != nil {
		h.logger.ErrorContext(r.Context(), "health check: write response", "err", err)
	}
}
