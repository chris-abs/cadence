// Package httpx holds the small JSON helpers every handler uses, so responses
// and errors have one shape across the API (see api/openapi.yaml, Error).
package httpx

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
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
