package httpx_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
)

type payload struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func TestDecodeJSON(t *testing.T) {
	var p payload
	rec := httptest.NewRecorder()
	req := jsonRequest(`{"name":"Ada","age":36}`)
	if err := httpx.DecodeJSON(rec, req, &p, 0); err != nil {
		t.Fatalf("DecodeJSON: %v", err)
	}
	if p != (payload{Name: "Ada", Age: 36}) {
		t.Errorf("got %+v", p)
	}
}

func TestDecodeJSONRejects(t *testing.T) {
	tests := []struct {
		name        string
		body        string
		contentType string
		maxBytes    int64
		wantStatus  int
		wantCode    string
		wantMessage string
	}{
		{"empty body", ``, "application/json", 0, 400, httpx.CodeInvalidRequest, "must not be empty"},
		{"malformed", `{"name":`, "application/json", 0, 400, httpx.CodeInvalidRequest, "not valid JSON"},
		{"syntax error", `{"name" "Ada"}`, "application/json", 0, 400, httpx.CodeInvalidRequest, "not valid JSON"},
		{"unknown field", `{"name":"Ada","admin":true}`, "application/json", 0, 400, httpx.CodeInvalidRequest, `"admin"`},
		{"wrong type", `{"age":"old"}`, "application/json", 0, 400, httpx.CodeInvalidRequest, `"age"`},
		{"not an object", `[1,2]`, "application/json", 0, 400, httpx.CodeInvalidRequest, "JSON object"},
		{"two objects", `{"name":"a"}{"name":"b"}`, "application/json", 0, 400, httpx.CodeInvalidRequest, "single JSON object"},
		{"trailing garbage", `{"name":"a"} x`, "application/json", 0, 400, httpx.CodeInvalidRequest, "single JSON object"},
		{"too large", `{"name":"` + strings.Repeat("a", 100) + `"}`, "application/json", 32, 413, httpx.CodeTooLarge, "32 bytes"},
		{"wrong content type", `{"name":"a"}`, "text/plain", 0, 415, httpx.CodeUnsupportedMedia, "application/json"},
		{"missing content type", `{"name":"a"}`, "", 0, 415, httpx.CodeUnsupportedMedia, "application/json"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}
			var p payload
			err := httpx.DecodeJSON(httptest.NewRecorder(), req, &p, tt.maxBytes)

			var de *httpx.DecodeError
			if !errors.As(err, &de) {
				t.Fatalf("want *DecodeError, got %T: %v", err, err)
			}
			if de.Status != tt.wantStatus || de.Code != tt.wantCode {
				t.Errorf("got %d %s, want %d %s", de.Status, de.Code, tt.wantStatus, tt.wantCode)
			}
			if !strings.Contains(de.Message, tt.wantMessage) {
				t.Errorf("message %q does not contain %q", de.Message, tt.wantMessage)
			}

			rec := httptest.NewRecorder()
			if err := httpx.WriteDecodeError(rec, err); err != nil {
				t.Fatalf("WriteDecodeError: %v", err)
			}
			assertError(t, rec, tt.wantStatus, tt.wantCode)
		})
	}
}

func jsonRequest(body string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return req
}

func assertError(t *testing.T, rec *httptest.ResponseRecorder, status int, code string) api.Error {
	t.Helper()
	if rec.Code != status {
		t.Errorf("status = %d, want %d", rec.Code, status)
	}
	var got api.Error
	dec := json.NewDecoder(bytes.NewReader(rec.Body.Bytes()))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&got); err != nil {
		t.Fatalf("body %q does not match the contract's Error: %v", rec.Body, err)
	}
	if got.Error.Code != code {
		t.Errorf("code = %q, want %q", got.Error.Code, code)
	}
	if got.Error.Message == "" {
		t.Error("message must not be empty")
	}
	return got
}
