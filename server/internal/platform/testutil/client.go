package testutil

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
)

const Password = "correct horse battery"

type Build func(pool *pgxpool.Pool, now func() time.Time, hasher passhash.Hasher) (http.Handler, error)

type Server struct {
	Handler http.Handler
	Pool    *pgxpool.Pool
	Clock   *Clock
	nextIP  atomic.Int64
}

func NewServer(t *testing.T, build Build) *Server {
	t.Helper()
	s := &Server{Pool: NewDB(t), Clock: NewClock()}
	h, err := build(s.Pool, s.Clock.Now, passhash.NewBcrypt(bcrypt.MinCost))
	if err != nil {
		t.Fatalf("build handler: %v", err)
	}
	s.Handler = h
	return s
}

func (s *Server) Count(t *testing.T, sql string, args ...any) int {
	t.Helper()
	var n int
	if err := s.Pool.QueryRow(t.Context(), sql, args...).Scan(&n); err != nil {
		t.Fatalf("%s: %v", sql, err)
	}
	return n
}

type Device struct {
	t       *testing.T
	srv     *Server
	ip      string
	Cookies map[string]string
	Header  http.Header
}

func (s *Server) Device(t *testing.T) *Device {
	n := s.nextIP.Add(1)
	return &Device{t: t, srv: s, ip: fmt.Sprintf("10.0.%d.%d:4000", n>>8&255, n&255), Cookies: map[string]string{}, Header: http.Header{}}
}

func (d *Device) Do(method, path string, body any) *httptest.ResponseRecorder {
	d.t.Helper()
	var raw []byte
	if body != nil {
		var err error
		if raw, err = json.Marshal(body); err != nil {
			d.t.Fatalf("marshal body: %v", err)
		}
	}
	req := httptest.NewRequestWithContext(d.t.Context(), method, "/api"+path, bytes.NewReader(raw))
	req.RemoteAddr = d.ip
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for k, v := range d.Header {
		req.Header[k] = v
	}
	for name, value := range d.Cookies {
		req.Header.Add("Cookie", name+"="+value)
	}
	rec := httptest.NewRecorder()
	d.srv.Handler.ServeHTTP(rec, req)
	for _, c := range rec.Result().Cookies() {
		if c.MaxAge < 0 {
			delete(d.Cookies, c.Name)
		} else {
			d.Cookies[c.Name] = c.Value
		}
	}
	return rec
}

func (d *Device) Expect(rec *httptest.ResponseRecorder, status int, code string) {
	d.t.Helper()
	if rec.Code != status {
		d.t.Fatalf("status = %d, want %d: %s", rec.Code, status, rec.Body)
	}
	if code == "" {
		return
	}
	var body api.Error
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || body.Error.Code != code {
		d.t.Fatalf("code = %q, want %q: %s", body.Error.Code, code, rec.Body)
	}
}

func Decode[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	dec := json.NewDecoder(bytes.NewReader(rec.Body.Bytes()))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&v); err != nil {
		t.Fatalf("body %s does not match %T: %v", rec.Body, v, err)
	}
	return v
}

func (d *Device) Call(method, path string, body any, status int) *httptest.ResponseRecorder {
	d.t.Helper()
	rec := d.Do(method, path, body)
	d.Expect(rec, status, "")
	return rec
}

func (d *Device) Register(email string) api.Me {
	d.t.Helper()
	rec := d.Call(http.MethodPost, "/auth/register", map[string]any{
		"email": email, "password": Password, "familyName": "Abbotts",
		"owner": map[string]any{"name": "Owner", "colour": "teal", "timezone": "Europe/London"},
	}, http.StatusCreated)
	return Decode[api.Me](d.t, rec)
}

func (d *Device) Login(email string) api.FamilySession {
	d.t.Helper()
	rec := d.Call(http.MethodPost, "/auth/login", map[string]any{"email": email, "password": Password}, http.StatusOK)
	return Decode[api.FamilySession](d.t, rec)
}

func (d *Device) Select(profileID string, pin string) *httptest.ResponseRecorder {
	d.t.Helper()
	body := map[string]any{"profileId": profileID}
	if pin != "" {
		body["pin"] = pin
	}
	return d.Do(http.MethodPost, "/auth/profile-session", body)
}

func (d *Device) CreateProfile(name, role, pin string) api.Profile {
	d.t.Helper()
	body := map[string]any{"name": name, "colour": "rose", "role": role}
	if pin != "" {
		body["pin"] = pin
	}
	return Decode[api.Profile](d.t, d.Call(http.MethodPost, "/profiles", body, http.StatusCreated))
}

func (d *Device) Join(email, profileID, pin string) api.Me {
	d.t.Helper()
	d.Login(email)
	rec := d.Select(profileID, pin)
	d.Expect(rec, http.StatusOK, "")
	return Decode[api.Me](d.t, rec)
}
