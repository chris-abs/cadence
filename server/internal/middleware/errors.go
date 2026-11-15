package middleware

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/google/uuid"

	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

type errorResponse struct {
	err     error
	status  int
	code    string
	message string
}

var errorResponses = []errorResponse{
	{models.ErrFamilySessionRequired, http.StatusUnauthorized, httpx.CodeFamilySessionRequired, "Sign in to your family first."},
	{models.ErrProfileSessionRequired, http.StatusUnauthorized, httpx.CodeProfileSessionRequired, "Choose your profile first."},
	{models.ErrInvalidCredentials, http.StatusUnauthorized, httpx.CodeInvalidCredentials, "That email and password do not match."},
	{models.ErrForbidden, http.StatusForbidden, httpx.CodeForbidden, "You are not allowed to do that."},
	{models.ErrInvalidPIN, http.StatusForbidden, httpx.CodeInvalidPIN, "That PIN is not right."},
	{models.ErrInvalidPassword, http.StatusForbidden, httpx.CodeInvalidPassword, "That password is not right."},
	{models.ErrRegistrationClosed, http.StatusForbidden, httpx.CodeRegistrationClosed, "New families cannot sign up right now."},
	{models.ErrNotFound, http.StatusNotFound, httpx.CodeNotFound, "Not found."},
	{models.ErrEmailTaken, http.StatusConflict, httpx.CodeEmailTaken, "A family already uses that email."},
	{models.ErrNameTaken, http.StatusConflict, httpx.CodeNameTaken, "Another profile already has that name."},
	{models.ErrOwnerProtected, http.StatusConflict, httpx.CodeOwnerProtected, "The family owner cannot be changed or removed."},
	{models.ErrSelfNotAllowed, http.StatusConflict, httpx.CodeSelfNotAllowed, "You cannot do that to your own profile."},
	{models.ErrProfileLimitReached, http.StatusConflict, httpx.CodeProfileLimitReached, "A family can have at most 20 profiles."},
}

func Handle(log *slog.Logger, fn func(http.ResponseWriter, *http.Request) error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := fn(w, r); err != nil {
			WriteError(w, r, log, err)
		}
	})
}

func WriteError(w http.ResponseWriter, r *http.Request, log *slog.Logger, err error) {
	if errors.Is(err, httpx.ErrResponseWritten) {
		log.ErrorContext(r.Context(), "write response", "err", err)
		return
	}
	logWrite(r, log, writeError(w, r, log, err))
}

func writeError(w http.ResponseWriter, r *http.Request, log *slog.Logger, err error) error {
	var (
		decodeErr *httpx.DecodeError
		validErr  *models.ValidationError
		retryErr  *models.RetryError
	)
	switch {
	case errors.As(err, &decodeErr):
		return httpx.WriteDecodeError(w, err)
	case errors.As(err, &validErr):
		return httpx.WriteError(w, http.StatusUnprocessableEntity, httpx.CodeValidationFailed, "Check the highlighted fields.", validErr.Fields)
	case errors.As(err, &retryErr):
		if retryErr.Locked {
			return httpx.WriteRetryLater(w, httpx.CodePINLocked, "Too many wrong PINs. This profile is locked for now.", retryErr.After)
		}
		return httpx.WriteRetryLater(w, httpx.CodeRateLimited, "Too many attempts. Try again shortly.", retryErr.After)
	}
	for _, e := range errorResponses {
		if errors.Is(err, e.err) {
			return httpx.WriteError(w, e.status, e.code, e.message, nil)
		}
	}
	log.ErrorContext(r.Context(), "request failed", "err", err, "path", r.URL.Path)
	return httpx.WriteError(w, http.StatusInternalServerError, httpx.CodeInternal, "Something went wrong.", nil)
}

func logWrite(r *http.Request, log *slog.Logger, err error) {
	if err != nil {
		log.ErrorContext(r.Context(), "write response", "err", err)
	}
}

func Audit(ctx context.Context, log *slog.Logger, event string, attrs ...slog.Attr) {
	log.LogAttrs(ctx, slog.LevelInfo, "audit", append([]slog.Attr{slog.String("event", event)}, attrs...)...)
}

func FamilyAttr(id uuid.UUID) slog.Attr  { return slog.String("family_id", id.String()) }
func ProfileAttr(id uuid.UUID) slog.Attr { return slog.String("profile_id", id.String()) }
func ActorAttr(id uuid.UUID) slog.Attr   { return slog.String("actor_id", id.String()) }
func SessionAttr(id uuid.UUID) slog.Attr { return slog.String("session_id", id.String()) }
