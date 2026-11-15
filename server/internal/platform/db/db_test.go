package db_test

import (
	"strings"
	"testing"
	"time"

	"github.com/chris-abs/cadence/server/internal/platform/db"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
	"github.com/chris-abs/cadence/server/internal/store"
)

// TestRoundTrip proves the whole data path: pgtestdb + goose migrations, the
// pgx pool from db.Open, and sqlc-generated queries.
func TestRoundTrip(t *testing.T) {
	t.Parallel()
	pool := testutil.NewDB(t)

	now, err := store.New(pool).DatabaseNow(t.Context())
	if err != nil {
		t.Fatalf("DatabaseNow: %v", err)
	}
	if skew := time.Since(now).Abs(); skew > time.Minute {
		t.Errorf("database clock is %s away from the test clock", skew)
	}
}

// TestBaselineUpdatedAtTrigger checks the baseline migration's trigger
// function against a scratch table, since no real table uses it yet.
func TestBaselineUpdatedAtTrigger(t *testing.T) {
	t.Parallel()
	pool := testutil.NewDB(t)
	ctx := t.Context()

	for _, stmt := range []string{
		`CREATE TABLE scratch (id int PRIMARY KEY, n int NOT NULL, updated_at timestamptz NOT NULL)`,
		`CREATE TRIGGER scratch_updated_at BEFORE UPDATE ON scratch FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,
		`INSERT INTO scratch VALUES (1, 0, '2000-01-01T00:00:00Z')`,
		`UPDATE scratch SET n = 1 WHERE id = 1`,
	} {
		if _, err := pool.Exec(ctx, stmt); err != nil {
			t.Fatalf("%s: %v", stmt, err)
		}
	}
	var updated time.Time
	if err := pool.QueryRow(ctx, `SELECT updated_at FROM scratch WHERE id = 1`).Scan(&updated); err != nil {
		t.Fatalf("select: %v", err)
	}
	if updated.Year() == 2000 {
		t.Error("set_updated_at did not touch updated_at")
	}
}

func TestOpenRejectsBadURLWithoutLeakingIt(t *testing.T) {
	t.Parallel()
	_, err := db.Open(t.Context(), "postgres://u:hunter2@localhost:5433/db?sslmode=bogus")
	if err == nil {
		t.Fatal("expected an error")
	}
	if strings.Contains(err.Error(), "hunter2") {
		t.Errorf("error leaks the password: %v", err)
	}
}

func TestOpenFailsWhenUnreachable(t *testing.T) {
	t.Parallel()
	// Port 1 on localhost refuses connections immediately.
	if _, err := db.Open(t.Context(), "postgres://u:p@127.0.0.1:1/db?sslmode=disable"); err == nil {
		t.Fatal("expected a ping error")
	}
}
