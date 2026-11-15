package middleware

import (
	"fmt"
	"log/slog"
	"mime"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/chris-abs/cadence/server/internal/platform/audit"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

type Middleware func(http.Handler) http.Handler

func Chain(h http.Handler, mws ...Middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

func SecurityHeaders(hsts bool) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Referrer-Policy", "no-referrer")
			h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
			h.Set("Cross-Origin-Resource-Policy", "same-origin")
			h.Set("Cache-Control", "no-store")
			if hsts {
				h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
			}
			next.ServeHTTP(w, r)
		})
	}
}

func LogRequests(log *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rec, r)
			level := slog.LevelInfo
			if rec.status >= http.StatusInternalServerError {
				level = slog.LevelError
			}
			log.LogAttrs(r.Context(), level, "request",
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

func RecoverPanic(log *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				v := recover()
				if v == nil {
					return
				}
				if v == http.ErrAbortHandler { //nolint:errorlint // net/http panics with the bare sentinel and compares it with == itself.
					panic(v)
				}
				log.ErrorContext(r.Context(), "panic serving request",
					"panic", fmt.Sprint(v), "path", r.URL.Path, "stack", string(debug.Stack()))
				httpx.LogWrite(r, log, httpx.WriteError(w, http.StatusInternalServerError, httpx.CodeInternal, "Something went wrong.", nil))
			}()
			next.ServeHTTP(w, r)
		})
	}
}

func LimitBody(maxBytes int64) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

func RequireJSONBody(log *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.ContentLength != 0 {
				mt, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
				if err != nil || mt != "application/json" {
					httpx.LogWrite(r, log, httpx.WriteError(w, http.StatusUnsupportedMediaType, httpx.CodeUnsupportedMedia,
						"Content-Type must be application/json.", nil))
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func CrossOriginDenied(log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		audit.Event(r.Context(), log, "auth.cross_origin_blocked", slog.String("method", r.Method), slog.String("path", r.URL.Path))
		httpx.LogWrite(r, log, httpx.WriteError(w, http.StatusForbidden, httpx.CodeCrossOrigin, "Cross-origin requests are not allowed.", nil))
	})
}

func ErrorShapedFallbacks(mux *http.ServeMux, log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, pattern := mux.Handler(r); pattern != "" {
			mux.ServeHTTP(w, r)
			return
		}
		mux.ServeHTTP(&fallbackWriter{ResponseWriter: w, r: r, log: log}, r)
	})
}

type fallbackWriter struct {
	http.ResponseWriter
	r       *http.Request
	log     *slog.Logger
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
	httpx.LogWrite(f.r, f.log, httpx.WriteError(f.ResponseWriter, status, code, msg, nil))
}

func (f *fallbackWriter) Write(b []byte) (int, error) {
	if !f.written {
		f.WriteHeader(http.StatusOK)
	}
	return len(b), nil
}

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

func (s *statusRecorder) Unwrap() http.ResponseWriter { return s.ResponseWriter }
