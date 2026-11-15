package app

import (
	"fmt"
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

// middleware wraps a handler. Chains are written outermost first.
type middleware func(http.Handler) http.Handler

func chain(h http.Handler, mws ...middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

// securityHeaders sets headers suitable for a JSON API. The CSP forbids
// everything because API responses are never meant to be rendered; if the Go
// binary later serves the built client, that route needs its own policy.
func securityHeaders(env Env) middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Referrer-Policy", "no-referrer")
			h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
			h.Set("Cross-Origin-Resource-Policy", "same-origin")
			// Responses will carry per-family data; never let a cache keep them.
			h.Set("Cache-Control", "no-store")
			// HSTS only in production: on localhost it would pin the browser
			// to HTTPS for every local project.
			if env == EnvProduction {
				h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
			}
			next.ServeHTTP(w, r)
		})
	}
}

// logRequests emits one structured line per request. It sits outside
// recoverPanic so a recovered panic is logged with its final 500 status.
func logRequests(logger *slog.Logger) middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rec, r)

			level := slog.LevelInfo
			if rec.status >= http.StatusInternalServerError {
				level = slog.LevelError
			}
			logger.LogAttrs(r.Context(), level, "request",
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", rec.status),
				slog.Int("bytes", rec.bytes),
				slog.Duration("duration", time.Since(start)),
				slog.String("remote", r.RemoteAddr),
			)
		})
	}
}

// recoverPanic turns a handler panic into a logged 500 so one bad request
// cannot take the process down or leak a stack trace to the client.
func recoverPanic(logger *slog.Logger) middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				v := recover()
				if v == nil {
					return
				}
				// ErrAbortHandler is net/http's sanctioned way to abort a
				// response; it must keep propagating.
				if v == http.ErrAbortHandler { //nolint:errorlint // net/http panics with the bare sentinel and compares it with == itself.
					panic(v)
				}
				logger.ErrorContext(r.Context(), "panic serving request",
					"panic", fmt.Sprint(v), "path", r.URL.Path, "stack", string(debug.Stack()))
				// If the handler already wrote headers this cannot change the
				// status, but the connection is still closed cleanly.
				if err := httpx.WriteError(w, http.StatusInternalServerError, httpx.CodeInternal, "Something went wrong.", nil); err != nil {
					logger.ErrorContext(r.Context(), "write panic response", "err", err)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// limitBody caps every request body, as a backstop for handlers that read the
// body without httpx.DecodeJSON.
func limitBody(maxBytes int64) middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

// statusRecorder captures what a handler wrote, for logging.
type statusRecorder struct {
	http.ResponseWriter
	status      int
	bytes       int
	wroteHeader bool
}

func (s *statusRecorder) WriteHeader(code int) {
	if !s.wroteHeader {
		s.status = code
		s.wroteHeader = true
	}
	s.ResponseWriter.WriteHeader(code)
}

func (s *statusRecorder) Write(b []byte) (int, error) {
	s.wroteHeader = true
	n, err := s.ResponseWriter.Write(b)
	s.bytes += n
	return n, err
}

// Unwrap lets http.ResponseController reach the underlying writer (Flush,
// deadlines) through this wrapper.
func (s *statusRecorder) Unwrap() http.ResponseWriter { return s.ResponseWriter }
