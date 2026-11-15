package httpx

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/chris-abs/cadence/server/internal/models"
)

type errorResponse struct {
	err     error
	status  int
	code    string
	message string
}

var errorResponses = []errorResponse{
	{models.ErrFamilySessionRequired, http.StatusUnauthorized, CodeFamilySessionRequired, "Sign in to your family first."},
	{models.ErrProfileSessionRequired, http.StatusUnauthorized, CodeProfileSessionRequired, "Choose your profile first."},
	{models.ErrInvalidCredentials, http.StatusUnauthorized, CodeInvalidCredentials, "That email and password do not match."},
	{models.ErrForbidden, http.StatusForbidden, CodeForbidden, "You are not allowed to do that."},
	{models.ErrInvalidPIN, http.StatusForbidden, CodeInvalidPIN, "That PIN is not right."},
	{models.ErrInvalidPassword, http.StatusForbidden, CodeInvalidPassword, "That password is not right."},
	{models.ErrRegistrationClosed, http.StatusForbidden, CodeRegistrationClosed, "New families cannot sign up right now."},
	{models.ErrNotFound, http.StatusNotFound, CodeNotFound, "Not found."},
	{models.ErrEmailTaken, http.StatusConflict, CodeEmailTaken, "A family already uses that email."},
	{models.ErrNameTaken, http.StatusConflict, CodeNameTaken, "Another profile already has that name."},
	{models.ErrOwnerProtected, http.StatusConflict, CodeOwnerProtected, "The family owner cannot be changed or removed."},
	{models.ErrSelfNotAllowed, http.StatusConflict, CodeSelfNotAllowed, "You cannot do that to your own profile."},
	{models.ErrProfileLimitReached, http.StatusConflict, CodeProfileLimitReached, "A family can have at most 20 profiles."},
}

func Handle(log *slog.Logger, fn func(http.ResponseWriter, *http.Request) error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := fn(w, r); err != nil {
			Fail(w, r, log, err)
		}
	})
}

func Fail(w http.ResponseWriter, r *http.Request, log *slog.Logger, err error) {
	if errors.Is(err, ErrResponseWritten) {
		log.ErrorContext(r.Context(), "write response", "err", err)
		return
	}
	LogWrite(r, log, writeError(w, r, log, err))
}

func writeError(w http.ResponseWriter, r *http.Request, log *slog.Logger, err error) error {
	var (
		decodeErr *DecodeError
		validErr  *models.ValidationError
		retryErr  *models.RetryError
	)
	switch {
	case errors.As(err, &decodeErr):
		return WriteDecodeError(w, err)
	case errors.As(err, &validErr):
		return WriteError(w, http.StatusUnprocessableEntity, CodeValidationFailed, "Check the highlighted fields.", validErr.Fields)
	case errors.As(err, &retryErr):
		if retryErr.Locked {
			return WriteRetryLater(w, CodePINLocked, "Too many wrong PINs. This profile is locked for now.", retryErr.After)
		}
		return WriteRetryLater(w, CodeRateLimited, "Too many attempts. Try again shortly.", retryErr.After)
	}
	for _, e := range errorResponses {
		if errors.Is(err, e.err) {
			return WriteError(w, e.status, e.code, e.message, nil)
		}
	}
	log.ErrorContext(r.Context(), "request failed", "err", err, "path", r.URL.Path)
	return WriteError(w, http.StatusInternalServerError, CodeInternal, "Something went wrong.", nil)
}

func LogWrite(r *http.Request, log *slog.Logger, err error) {
	if err != nil {
		log.ErrorContext(r.Context(), "write response", "err", err)
	}
}
