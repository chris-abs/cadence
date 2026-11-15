// Package testutil gives tests real infrastructure. Import it only from
// _test.go files.
package testutil

import (
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib" // "pgx" database/sql driver, which pgtestdb uses for setup.
	"github.com/peterldowns/pgtestdb"
	"github.com/peterldowns/pgtestdb/migrators/goosemigrator"

	"github.com/chris-abs/cadence/server/db"
	platformdb "github.com/chris-abs/cadence/server/internal/platform/db"
)

// EnvTestDatabaseURL overrides the server tests connect to for creating test
// databases. It must point at a disposable Postgres: tests create and drop
// databases there.
const EnvTestDatabaseURL = "TEST_DATABASE_URL"

// defaultTestDatabaseURL is the local Docker Postgres from docker-compose.yml.
// The password is the compose default for a local-only container, not a secret.
const defaultTestDatabaseURL = "postgres://cadence:cadence_local_dev@localhost:5433/cadence?sslmode=disable" //nolint:gosec // local Docker default, see docker-compose.yml.

// NewDB returns a pool connected to a fresh database with every migration
// applied, dropped when the test ends. pgtestdb migrates a template database
// once per migration hash and clones it per test, so this is cheap and tests
// using it can run in parallel.
func NewDB(t testing.TB) *pgxpool.Pool {
	t.Helper()
	conf := pgtestdb.Custom(t, serverConfig(t), goosemigrator.New("migrations", goosemigrator.WithFS(db.Migrations)))

	pool, err := platformdb.Open(t.Context(), conf.URL())
	if err != nil {
		t.Fatalf("testutil: open test database: %v", err)
	}
	// Registered after pgtestdb's own cleanup, so it runs first: connections
	// must be closed before the database can be dropped.
	t.Cleanup(pool.Close)
	return pool
}

// URL returns the connection string of the Postgres server tests use.
func URL() string {
	if v := os.Getenv(EnvTestDatabaseURL); v != "" {
		return v
	}
	return defaultTestDatabaseURL
}

func serverConfig(t testing.TB) pgtestdb.Config {
	t.Helper()
	u, err := url.Parse(URL())
	if err != nil || u.Host == "" {
		// Never echo the URL: an override may carry a real password.
		t.Fatalf("testutil: %s is not a valid postgres URL", EnvTestDatabaseURL)
	}
	password, _ := u.User.Password()
	return pgtestdb.Config{
		DriverName: "pgx",
		Host:       u.Hostname(),
		Port:       u.Port(),
		User:       u.User.Username(),
		Password:   password,
		Database:   strings.TrimPrefix(u.Path, "/"),
		Options:    u.RawQuery,
	}
}
