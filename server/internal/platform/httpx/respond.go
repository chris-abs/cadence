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

const (
	CodeInvalidRequest   = "invalid_request"
	CodeTooLarge         = "request_too_large"
	CodeUnsupportedMedia = "unsupported_media_type"
	CodeNotFound         = "not_found"
	CodeInternal         = "internal_error"
	CodeUnavailable      = "service_unavailable"
	CodeMethodNotAllowed = "method_not_allowed"

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

type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code              string            `json:"code"`
	Message           string            `json:"message"`
	Fields            map[string]string `json:"fields,omitempty"`
	RetryAfterSeconds int               `json:"retryAfterSeconds,omitempty"`
}

func WriteJSON(w http.ResponseWriter, status int, v any) error {
	body, err := json.Marshal(v)
	if err != nil {
		encErr := fmt.Errorf("%w: encode %T response: %w", ErrResponseWritten, v, err)
		return errors.Join(encErr, writeRaw(w, http.StatusInternalServerError, []byte(internalErrorBody)))
	}
	return writeRaw(w, status, append(body, '\n'))
}

var ErrResponseWritten = errors.New("response already written")

func NoContent(w http.ResponseWriter) error {
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func WriteError(w http.ResponseWriter, status int, code, message string, fields map[string]string) error {
	return WriteJSON(w, status, ErrorBody{Error: ErrorDetail{Code: code, Message: message, Fields: fields}})
}

func WriteRetryLater(w http.ResponseWriter, code, message string, wait time.Duration) error {
	secs := max(1, int(math.Ceil(wait.Seconds())))
	w.Header().Set("Retry-After", strconv.Itoa(secs))
	return WriteJSON(w, http.StatusTooManyRequests, ErrorBody{Error: ErrorDetail{Code: code, Message: message, RetryAfterSeconds: secs}})
}

const internalErrorBody = `{"error":{"code":"internal_error","message":"Something went wrong."}}` + "\n"

func writeRaw(w http.ResponseWriter, status int, body []byte) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if _, err := w.Write(body); err != nil {
		return fmt.Errorf("%w: %w", ErrResponseWritten, err)
	}
	return nil
}
