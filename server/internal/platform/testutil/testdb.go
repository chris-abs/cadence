package testutil

import (
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/peterldowns/pgtestdb"
	"github.com/peterldowns/pgtestdb/migrators/goosemigrator"

	"github.com/chris-abs/cadence/server/db"
	platformdb "github.com/chris-abs/cadence/server/internal/platform/db"
)

const EnvTestDatabaseURL = "TEST_DATABASE_URL"

const defaultTestDatabaseURL = "postgres://cadence:cadence_local_dev@localhost:5433/cadence?sslmode=disable" //nolint:gosec // local Docker default, see docker-compose.yml.

func NewDB(t testing.TB) *pgxpool.Pool {
	t.Helper()
	conf := pgtestdb.Custom(t, serverConfig(t), goosemigrator.New("migrations", goosemigrator.WithFS(db.Migrations)))

	pool, err := platformdb.Open(t.Context(), conf.URL())
	if err != nil {
		t.Fatalf("testutil: open test database: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

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
