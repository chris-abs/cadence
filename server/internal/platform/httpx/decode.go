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

const DefaultMaxBodyBytes = 1 << 20

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
		return bad("Unknown field " + strings.TrimPrefix(err.Error(), unknownFieldPrefix) + ".")
	default:
		return bad("Request body could not be decoded.")
	}
}

const unknownFieldPrefix = "json: unknown field "

func WriteDecodeError(w http.ResponseWriter, err error) error {
	var de *DecodeError
	if !errors.As(err, &de) {
		de = &DecodeError{Status: http.StatusBadRequest, Code: CodeInvalidRequest, Message: "Invalid request body."}
	}
	return WriteError(w, de.Status, de.Code, de.Message, nil)
}
