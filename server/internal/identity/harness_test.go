package identity_test

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"maps"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/identity"
	platformdb "github.com/chris-abs/cadence/server/internal/platform/db"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

// Cookie names outside production (spec §3).
const (
	familyCookie  = "cadence_family"
	profileCookie = "cadence_profile"
)

// countingHasher is bcrypt at the minimum cost that counts its calls, so
// tests can assert bcrypt runs only on login, re-auth and PIN entry.
type countingHasher struct {
	inner passhash.Bcrypt
	calls atomic.Int64
}

func (h *countingHasher) Hash(s string) (string, error) {
	h.calls.Add(1)
	return h.inner.Hash(s)
}

func (h *countingHasher) Matches(hash, s string) (bool, error) {
	h.calls.Add(1)
	return h.inner.Matches(hash, s)
}

// env is one test's server: the real router on a fresh database, a fake
// clock, a counting hasher and a query counter.
type env struct {
	t       *testing.T
	h       *app.Handler
	pool    *pgxpool.Pool
	clock   *testutil.Clock
	hasher  *countingHasher
	queries *testutil.QueryCounter
	logs    *syncBuffer
	nextIP  *atomic.Int64
	nextID  *atomic.Int64
}

// forTest returns e bound to subtest t, sharing the server and counters, so
// helpers fail the right test.
func (e *env) forTest(t *testing.T) *env {
	c := *e
	c.t = t
	return &c
}

type envOption func(*app.Deps)

func withRegistration(m identity.RegistrationMode) envOption {
	return func(d *app.Deps) { d.Registration = m }
}

func newEnv(t *testing.T, opts ...envOption) *env {
	t.Helper()
	e := &env{
		t:       t,
		clock:   testutil.NewClock(),
		hasher:  &countingHasher{inner: passhash.NewBcrypt(bcrypt.MinCost)},
		queries: &testutil.QueryCounter{},
		logs:    &syncBuffer{},
		nextIP:  &atomic.Int64{},
		nextID:  &atomic.Int64{},
	}
	e.pool = testutil.NewDB(t, platformdb.WithTracer(e.queries))
	e.h = e.handler(opts...)
	return e
}

// handler builds a new server on the same database, as after a restart.
func (e *env) handler(opts ...envOption) *app.Handler {
	e.t.Helper()
	d := app.Deps{
		Logger: slog.New(slog.NewTextHandler(e.logs, nil)), DB: e.pool, Env: app.EnvTest,
		Registration: identity.RegistrationOpen, Now: e.clock.Now, Hasher: e.hasher,
	}
	for _, o := range opts {
		o(&d)
	}
	h, err := app.NewHandler(d)
	if err != nil {
		e.t.Fatalf("NewHandler: %v", err)
	}
	return h
}

// device is one browser: its own IP and cookie jar.
type device struct {
	e       *env
	h       http.Handler
	ip      string
	cookies map[string]string
	headers map[string]string
}

func (e *env) device() *device {
	n := e.nextIP.Add(1)
	return &device{e: e, h: e.h, ip: fmt.Sprintf("10.%d.%d.%d:4000", n>>16&255, n>>8&255, n&255), cookies: map[string]string{}, headers: map[string]string{}}
}

// with returns a copy of d with only the given cookies, for confusion tests.
func (d *device) with(cookies map[string]string) *device {
	c := *d
	c.cookies = maps.Clone(cookies)
	c.headers = maps.Clone(d.headers)
	return &c
}

func (d *device) do(method, path string, body any) *httptest.ResponseRecorder {
	d.e.t.Helper()
	var reader *bytes.Reader
	switch b := body.(type) {
	case nil:
		reader = bytes.NewReader(nil)
	case string:
		reader = bytes.NewReader([]byte(b))
	default:
		raw, err := json.Marshal(b)
		if err != nil {
			d.e.t.Fatalf("marshal body: %v", err)
		}
		reader = bytes.NewReader(raw)
	}
	req := httptest.NewRequest(method, "/api"+path, reader)
	req.RemoteAddr = d.ip
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for k, v := range d.headers {
		req.Header.Set(k, v)
	}
	for name, value := range d.cookies {
		req.AddCookie(&http.Cookie{Name: name, Value: value})
	}
	rec := httptest.NewRecorder()
	d.h.ServeHTTP(rec, req)
	for _, c := range rec.Result().Cookies() {
		if c.MaxAge < 0 {
			delete(d.cookies, c.Name)
		} else {
			d.cookies[c.Name] = c.Value
		}
	}
	return rec
}

// sessionID returns the id of the session behind one of d's cookies.
func (d *device) sessionID(cookie string) uuid.UUID {
	d.e.t.Helper()
	raw, err := base64.RawURLEncoding.DecodeString(d.cookies[cookie])
	if err != nil {
		d.e.t.Fatalf("cookie %s: %v", cookie, err)
	}
	sum := sha256.Sum256(raw)
	var id uuid.UUID
	if err := d.e.pool.QueryRow(d.e.t.Context(), `SELECT id FROM session WHERE token_hash = $1`, sum[:]).Scan(&id); err != nil {
		d.e.t.Fatalf("session for %s: %v", cookie, err)
	}
	return id
}

// decode strictly decodes a response into a generated contract type.
func decode[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	dec := json.NewDecoder(bytes.NewReader(rec.Body.Bytes()))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&v); err != nil {
		t.Fatalf("body %s does not match %T: %v", rec.Body, v, err)
	}
	return v
}

// wantStatus fails unless rec has status and, for errors, the given code.
func wantStatus(t *testing.T, rec *httptest.ResponseRecorder, status int, code string) {
	t.Helper()
	if rec.Code != status {
		t.Fatalf("status = %d, want %d; body %s", rec.Code, status, rec.Body)
	}
	if code != "" {
		if got := decode[api.Error](t, rec); got.Error.Code != code {
			t.Fatalf("code = %q, want %q", got.Error.Code, code)
		}
	}
}

// Fixtures.

const testPassword = "correct horse battery"

// member is a profile and the device signed in to it.
type member struct {
	id  string
	dev *device
}

// family is a registered family with an owner, a second PARENT and a CHILD,
// each on their own device, plus a device signed in to the family only.
type family struct {
	email, name string
	owner       member
	parent      member
	child       member
	fsOnly      *device
}

// uniq returns a unique suffix within the env.
func (e *env) uniq() int64 { return e.nextID.Add(1) }

// register creates a family and returns its owner.
func (e *env) register(name string) (*family, *api.Me) {
	e.t.Helper()
	f := &family{email: fmt.Sprintf("family%d@example.com", e.uniq()), name: name}
	dev := e.device()
	rec := dev.do(http.MethodPost, "/auth/register", map[string]any{
		"email": f.email, "password": testPassword, "familyName": name,
		"owner": map[string]any{"name": "Olive", "colour": "teal", "timezone": "Europe/London"},
	})
	wantStatus(e.t, rec, http.StatusCreated, "")
	me := decode[api.Me](e.t, rec)
	f.owner = member{id: me.Profile.Id, dev: dev}
	return f, &me
}

// newFamily registers a family with owner, parent, child and an FS-only device.
func (e *env) newFamily(name string) *family {
	e.t.Helper()
	f, _ := e.register(name)
	f.parent = e.join(f, f.owner.create("Pat", "PARENT"))
	f.child = e.join(f, f.owner.create("Kit", "CHILD"))
	f.fsOnly = e.login(f)
	return f
}

// create makes a profile as m and returns its id.
func (m member) create(name, role string) string {
	m.dev.e.t.Helper()
	rec := m.dev.do(http.MethodPost, "/profiles", map[string]any{"name": name, "role": role, "colour": "rose"})
	wantStatus(m.dev.e.t, rec, http.StatusCreated, "")
	return decode[api.Profile](m.dev.e.t, rec).Id
}

// login signs a new device in to f.
func (e *env) login(f *family) *device {
	e.t.Helper()
	dev := e.device()
	wantStatus(e.t, dev.do(http.MethodPost, "/auth/login", map[string]any{"email": f.email, "password": testPassword}), http.StatusOK, "")
	return dev
}

// join signs a new device in and selects profile id on it.
func (e *env) join(f *family, id string) member {
	e.t.Helper()
	dev := e.login(f)
	wantStatus(e.t, dev.do(http.MethodPost, "/auth/profile-session", map[string]any{"profileId": id}), http.StatusOK, "")
	return member{id: id, dev: dev}
}

// syncBuffer collects log output from concurrent requests.
type syncBuffer struct {
	mu sync.Mutex
	b  strings.Builder
}

func (s *syncBuffer) Write(p []byte) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.b.Write(p)
}

func (s *syncBuffer) String() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.b.String()
}
