package app

import (
	"log/slog"
	"mime"
	"net/http"

	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

// errorShapedFallbacks answers requests no route matches in the contract's
// Error shape: 404 for an unknown path, 405 (with ServeMux's Allow header)
// for a known path with the wrong method. ServeMux decides which; only its
// plain-text body is replaced.
func errorShapedFallbacks(mux *http.ServeMux, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, pattern := mux.Handler(r); pattern != "" {
			mux.ServeHTTP(w, r)
			return
		}
		mux.ServeHTTP(&fallbackWriter{ResponseWriter: w, r: r, logger: logger}, r)
	})
}

// fallbackWriter swaps ServeMux's 404/405 text for JSON and drops the text.
type fallbackWriter struct {
	http.ResponseWriter
	r       *http.Request
	logger  *slog.Logger
	written bool
}

func (f *fallbackWriter) WriteHeader(status int) {
	if f.written {
		return
	}
	f.written = true
	code, msg := httpx.CodeNotFound, "No such endpoint."
	if status == http.StatusMethodNotAllowed {
		code, msg = httpx.CodeMethodNotAllowed, "This endpoint does not support that method."
	} else if status != http.StatusNotFound {
		f.ResponseWriter.WriteHeader(status)
		return
	}
	// ServeMux already set text/plain; WriteError replaces it with JSON.
	if err := httpx.WriteError(f.ResponseWriter, status, code, msg, nil); err != nil {
		f.logger.ErrorContext(f.r.Context(), "write fallback response", "err", err)
	}
}

func (f *fallbackWriter) Write(b []byte) (int, error) {
	if !f.written {
		f.WriteHeader(http.StatusOK)
	}
	// Swallow ServeMux's body; report it as written so it stops.
	return len(b), nil
}

// requireJSONBody rejects any request that carries a body which is not
// application/json with 415, including on endpoints that take no body, so a
// form-encoded "simple" cross-site request can never reach a handler.
func requireJSONBody(logger *slog.Logger) middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.ContentLength != 0 {
				mt, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
				if err != nil || mt != "application/json" {
					if err := httpx.WriteError(w, http.StatusUnsupportedMediaType, httpx.CodeUnsupportedMedia,
						"Content-Type must be application/json.", nil); err != nil {
						logger.ErrorContext(r.Context(), "write unsupported media response", "err", err)
					}
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}
