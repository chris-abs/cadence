package httpx

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"strings"
)

// DefaultMaxBodyBytes caps a JSON request body. Cadence requests are small
// forms; anything bigger is a bug or abuse.
const DefaultMaxBodyBytes = 1 << 20 // 1 MiB

// DecodeError is a client mistake in the request body. Status is the HTTP
// status to answer with and Message is safe to show to users.
type DecodeError struct {
	Status  int
	Code    string
	Message string
	err     error
}

func (e *DecodeError) Error() string {
	if e.err != nil {
		return e.Message + ": " + e.err.Error()
	}
	return e.Message
}

func (e *DecodeError) Unwrap() error { return e.err }

// DecodeJSON decodes exactly one JSON object from r's body into dst. It is
// strict on purpose: unknown fields and trailing data are rejected so a client
// typo fails loudly instead of being silently ignored. maxBytes <= 0 means
// DefaultMaxBodyBytes. Every returned error is a *DecodeError.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any, maxBytes int64) error {
	if mt, _, err := mime.ParseMediaType(r.Header.Get("Content-Type")); err != nil || mt != "application/json" {
		return &DecodeError{Status: http.StatusUnsupportedMediaType, Code: CodeUnsupportedMedia,
			Message: "Content-Type must be application/json."}
	}
	if maxBytes <= 0 {
		maxBytes = DefaultMaxBodyBytes
	}
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBytes))
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		return decodeError(err)
	}
	// A second Decode must hit EOF; anything else means more than one value.
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			return decodeError(err)
		}
		return &DecodeError{Status: http.StatusBadRequest, Code: CodeInvalidRequest,
			Message: "Request body must contain a single JSON object.", err: err}
	}
	return nil
}

// decodeError turns encoding/json's errors into messages a user can act on.
func decodeError(err error) *DecodeError {
	bad := func(msg string) *DecodeError {
		return &DecodeError{Status: http.StatusBadRequest, Code: CodeInvalidRequest, Message: msg, err: err}
	}
	var (
		syntaxErr *json.SyntaxError
		typeErr   *json.UnmarshalTypeError
		tooLarge  *http.MaxBytesError
	)
	switch {
	case errors.As(err, &tooLarge):
		return &DecodeError{Status: http.StatusRequestEntityTooLarge, Code: CodeTooLarge,
			Message: fmt.Sprintf("Request body must not exceed %d bytes.", tooLarge.Limit), err: err}
	case errors.Is(err, io.EOF):
		return bad("Request body must not be empty.")
	case errors.As(err, &syntaxErr), errors.Is(err, io.ErrUnexpectedEOF):
		return bad("Request body is not valid JSON.")
	case errors.As(err, &typeErr):
		if typeErr.Field != "" {
			return bad(fmt.Sprintf("Field %q has the wrong type.", typeErr.Field))
		}
		return bad("Request body must be a JSON object.")
	case strings.HasPrefix(err.Error(), unknownFieldPrefix):
		// encoding/json has no typed error for this; its message is stable
		// and names the (already quoted) field, which is what the client needs.
		return bad("Unknown field " + strings.TrimPrefix(err.Error(), unknownFieldPrefix) + ".")
	default:
		return bad("Request body could not be decoded.")
	}
}

const unknownFieldPrefix = "json: unknown field "

// WriteDecodeError answers with the status and message carried by a
// *DecodeError, or a generic 400 for any other error.
func WriteDecodeError(w http.ResponseWriter, err error) error {
	var de *DecodeError
	if !errors.As(err, &de) {
		de = &DecodeError{Status: http.StatusBadRequest, Code: CodeInvalidRequest, Message: "Invalid request body."}
	}
	return WriteError(w, de.Status, de.Code, de.Message, nil)
}
