// Package httpx holds the small JSON helpers every handler uses, so responses
// and errors have one shape across the API (see api/openapi.yaml, Error).
package httpx

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"
)

// Stable error codes shared with the client. Add new ones here so they stay
// discoverable; the client switches on these, never on messages.
const (
	CodeInvalidRequest   = "invalid_request"
	CodeTooLarge         = "request_too_large"
	CodeUnsupportedMedia = "unsupported_media_type"
	CodeNotFound         = "not_found"
	CodeInternal         = "internal_error"
	CodeUnavailable      = "service_unavailable"
	CodeMethodNotAllowed = "method_not_allowed"

	// Identity and authorisation (docs/spec/identity.md §7).
	CodeFamilySessionRequired  = "family_session_required"
	CodeProfileSessionRequired = "profile_session_required"
	CodeInvalidCredentials     = "invalid_credentials" //nolint:gosec // an error code, not a credential.
	CodeForbidden              = "forbidden"
	CodeInvalidPIN             = "invalid_pin"
	CodeInvalidPassword        = "invalid_password"
	CodeModuleDisabled         = "module_disabled"
	CodeRegistrationClosed     = "registration_closed"
	CodeCrossOrigin            = "cross_origin"
	CodeEmailTaken             = "email_taken"
	CodeOwnerProtected         = "owner_protected"
	CodeSelfNotAllowed         = "self_not_allowed"
	CodeNameTaken              = "name_taken"
	CodeProfileLimitReached    = "profile_limit_reached"
	CodeValidationFailed       = "validation_failed"
	CodeRateLimited            = "rate_limited"
	CodePINLocked              = "pin_locked"
)

// ErrorBody is the contract's Error schema. It is hand-written rather than the
// generated type because the generator emits an anonymous nested struct; a test
// checks the two stay wire-compatible.
type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail is the inner object of ErrorBody.
type ErrorDetail struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
	// RetryAfterSeconds is set with rate_limited and pin_locked.
	RetryAfterSeconds int `json:"retryAfterSeconds,omitempty"`
}

// WriteJSON writes v as JSON with the given status. It encodes before writing
// any header so an encoding bug becomes a clean 500 rather than a truncated
// 200. The returned error is for logging; the response is already handled.
func WriteJSON(w http.ResponseWriter, status int, v any) error {
	body, err := json.Marshal(v)
	if err != nil {
		encErr := fmt.Errorf("encode %T response: %w", v, err)
		return errors.Join(encErr, writeRaw(w, http.StatusInternalServerError, []byte(internalErrorBody)))
	}
	return writeRaw(w, status, append(body, '\n'))
}

// WriteError writes the contract's Error shape. fields may be nil.
func WriteError(w http.ResponseWriter, status int, code, message string, fields map[string]string) error {
	return WriteJSON(w, status, ErrorBody{Error: ErrorDetail{Code: code, Message: message, Fields: fields}})
}

// WriteRetryLater answers 429 with code, a Retry-After header and
// retryAfterSeconds in the body. Waits round up to whole seconds, at least one,
// so a client that honours them never retries too early.
func WriteRetryLater(w http.ResponseWriter, code, message string, wait time.Duration) error {
	secs := max(1, int(math.Ceil(wait.Seconds())))
	w.Header().Set("Retry-After", strconv.Itoa(secs))
	return WriteJSON(w, http.StatusTooManyRequests, ErrorBody{Error: ErrorDetail{Code: code, Message: message, RetryAfterSeconds: secs}})
}

// internalErrorBody is pre-encoded so the fallback path cannot itself fail.
const internalErrorBody = `{"error":{"code":"internal_error","message":"Something went wrong."}}` + "\n"

func writeRaw(w http.ResponseWriter, status int, body []byte) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if _, err := w.Write(body); err != nil {
		return fmt.Errorf("write response: %w", err)
	}
	return nil
}
