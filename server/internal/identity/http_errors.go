package identity

import (
	"errors"
	"net/http"

	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

// errorResponse is one row of spec §7: the status, stable code and a message
// safe to show to users.
type errorResponse struct {
	status  int
	code    string
	message string
}

var errorResponses = []struct {
	err  error
	resp errorResponse
}{
	{ErrFamilySessionRequired, errorResponse{http.StatusUnauthorized, httpx.CodeFamilySessionRequired, "Sign in to your family first."}},
	{ErrProfileSessionRequired, errorResponse{http.StatusUnauthorized, httpx.CodeProfileSessionRequired, "Choose your profile first."}},
	{ErrInvalidCredentials, errorResponse{http.StatusUnauthorized, httpx.CodeInvalidCredentials, "That email and password do not match."}},
	{ErrForbidden, errorResponse{http.StatusForbidden, httpx.CodeForbidden, "You are not allowed to do that."}},
	{ErrInvalidPIN, errorResponse{http.StatusForbidden, httpx.CodeInvalidPIN, "That PIN is not right."}},
	{ErrInvalidPassword, errorResponse{http.StatusForbidden, httpx.CodeInvalidPassword, "That password is not right."}},
	{ErrRegistrationClosed, errorResponse{http.StatusForbidden, httpx.CodeRegistrationClosed, "New families cannot sign up right now."}},
	{ErrNotFound, errorResponse{http.StatusNotFound, httpx.CodeNotFound, "Not found."}},
	{ErrEmailTaken, errorResponse{http.StatusConflict, httpx.CodeEmailTaken, "A family already uses that email."}},
	{ErrNameTaken, errorResponse{http.StatusConflict, httpx.CodeNameTaken, "Another profile already has that name."}},
	{ErrOwnerProtected, errorResponse{http.StatusConflict, httpx.CodeOwnerProtected, "The family owner cannot be changed or removed."}},
	{ErrSelfNotAllowed, errorResponse{http.StatusConflict, httpx.CodeSelfNotAllowed, "You cannot do that to your own profile."}},
	{ErrProfileLimitReached, errorResponse{http.StatusConflict, httpx.CodeProfileLimitReached, "A family can have at most 20 profiles."}},
}

// writeError maps a domain error to the contract's Error shape. Unknown
// errors are logged with their cause and answered with a bare 500.
func (h *Handler) writeError(w http.ResponseWriter, r *http.Request, err error) {
	var (
		decodeErr *httpx.DecodeError
		validErr  *ValidationError
		retryErr  *RetryError
	)
	switch {
	case errors.As(err, &decodeErr):
		h.logWrite(r, httpx.WriteDecodeError(w, err))
		return
	case errors.As(err, &validErr):
		h.logWrite(r, httpx.WriteError(w, http.StatusUnprocessableEntity, httpx.CodeValidationFailed,
			"Check the highlighted fields.", validErr.Fields))
		return
	case errors.As(err, &retryErr):
		code, msg := httpx.CodeRateLimited, "Too many attempts. Try again shortly."
		if retryErr.Locked {
			code, msg = httpx.CodePINLocked, "Too many wrong PINs. This profile is locked for now."
		}
		h.logWrite(r, httpx.WriteRetryLater(w, code, msg, retryErr.After))
		return
	}

	// An expired or wrong session cookie is cleared so the browser stops
	// sending it (Max-Age=0).
	switch {
	case errors.Is(err, ErrFamilySessionRequired):
		if fs, ps := h.cookies.read(r); fs != "" || ps != "" {
			h.cookies.clearBoth(w)
		}
	case errors.Is(err, ErrProfileSessionRequired):
		if _, ps := h.cookies.read(r); ps != "" {
			h.cookies.clearProfile(w)
		}
	}
	for _, e := range errorResponses {
		if errors.Is(err, e.err) {
			h.logWrite(r, httpx.WriteError(w, e.resp.status, e.resp.code, e.resp.message, nil))
			return
		}
	}
	h.logger.ErrorContext(r.Context(), "identity request failed", "err", err, "path", r.URL.Path)
	h.logWrite(r, httpx.WriteError(w, http.StatusInternalServerError, httpx.CodeInternal, "Something went wrong.", nil))
}
