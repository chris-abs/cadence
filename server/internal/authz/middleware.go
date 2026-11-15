package authz

import (
	"log/slog"
	"net/http"

	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

// RequireModule wraps a module's routes so they answer 403 module_disabled
// while the family has the module switched off. It must sit inside the
// identity profile middleware, which provides the Subject; without one the
// request is refused as forbidden (fail closed).
func RequireModule(moduleID string, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			s, ok := SubjectFrom(r.Context())
			var err error
			switch {
			case !ok:
				err = httpx.WriteError(w, http.StatusForbidden, httpx.CodeForbidden, "You are not allowed to do that.", nil)
			case !s.ModuleEnabled(moduleID):
				err = httpx.WriteError(w, http.StatusForbidden, httpx.CodeModuleDisabled, "This module is switched off for your family.", nil)
			default:
				next.ServeHTTP(w, r)
				return
			}
			if err != nil {
				logger.ErrorContext(r.Context(), "write module check response", "err", err)
			}
		})
	}
}
