package identity_test

import (
	"context"
	"crypto/sha256"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

// These tests exercise the identity migration directly with SQL, so the
// database enforces the invariants even if Go code has a bug (spec §8 item 13).

type schemaFixture struct {
	pool    *pgxpool.Pool
	family  uuid.UUID
	other   uuid.UUID
	owner   uuid.UUID
	foreign uuid.UUID // a profile of the other family
}

func newSchemaFixture(t *testing.T) schemaFixture {
	t.Helper()
	f := schemaFixture{pool: testutil.NewDB(t)}
	f.family = insertFamily(t, f.pool, "a@example.com")
	f.other = insertFamily(t, f.pool, "b@example.com")
	f.owner = insertProfile(t, f.pool, f.family, "Owner", "PARENT", true)
	f.foreign = insertProfile(t, f.pool, f.other, "Foreign", "PARENT", true)
	return f
}

func insertFamily(t *testing.T, pool *pgxpool.Pool, email string) uuid.UUID {
	t.Helper()
	id := uuid.Must(uuid.NewV7())
	if _, err := pool.Exec(t.Context(),
		`INSERT INTO family (id, name, email, password_hash) VALUES ($1, 'Fam', $2, 'x')`, id, email); err != nil {
		t.Fatalf("insert family: %v", err)
	}
	return id
}

func insertProfile(t *testing.T, pool *pgxpool.Pool, family uuid.UUID, name, role string, owner bool) uuid.UUID {
	t.Helper()
	id := uuid.Must(uuid.NewV7())
	if err := execProfile(t.Context(), pool, id, family, name, role, owner); err != nil {
		t.Fatalf("insert profile: %v", err)
	}
	return id
}

func execProfile(ctx context.Context, pool *pgxpool.Pool, id, family uuid.UUID, name, role string, owner bool) error {
	_, err := pool.Exec(ctx, `INSERT INTO profile (id, family_id, name, role, is_owner, colour, timezone)
		VALUES ($1, $2, $3, $4, $5, 'blue', 'UTC')`, id, family, name, role, owner)
	return err
}

func insertSession(ctx context.Context, pool *pgxpool.Pool, kind string, family uuid.UUID, profile, familySession *uuid.UUID) (uuid.UUID, error) {
	id := uuid.Must(uuid.NewV7())
	hash := sha256.Sum256(id[:])
	now := time.Now()
	_, err := pool.Exec(ctx, `INSERT INTO session (id, token_hash, kind, family_id, profile_id, family_session_id, idle_expires_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, id, hash[:], kind, family, profile, familySession, now.Add(time.Hour), now.Add(2*time.Hour))
	return id, err
}

// wantViolation asserts err is a Postgres error naming constraint.
func wantViolation(t *testing.T, err error, constraint string) {
	t.Helper()
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		t.Fatalf("want violation of %s, got %v", constraint, err)
	}
	if pgErr.ConstraintName != constraint {
		t.Errorf("violated %q (%s), want %q", pgErr.ConstraintName, pgErr.Message, constraint)
	}
}

func TestSchemaConstraints(t *testing.T) {
	t.Parallel()
	f := newSchemaFixture(t)
	ctx := t.Context()
	pool := f.pool

	fs, err := insertSession(ctx, pool, "family", f.family, nil, nil)
	if err != nil {
		t.Fatalf("valid family session: %v", err)
	}
	if _, err := insertSession(ctx, pool, "profile", f.family, &f.owner, &fs); err != nil {
		t.Fatalf("valid profile session: %v", err)
	}

	tests := []struct {
		name       string
		run        func() error
		constraint string
	}{
		{"second owner", func() error {
			return execProfile(ctx, pool, uuid.Must(uuid.NewV7()), f.family, "Second", "PARENT", true)
		}, "profile_one_owner"},
		{"child owner", func() error {
			return execProfile(ctx, pool, uuid.Must(uuid.NewV7()), f.other, "Kid", "CHILD", true)
		}, "profile_owner_is_parent"},
		{"unknown role", func() error {
			return execProfile(ctx, pool, uuid.Must(uuid.NewV7()), f.family, "Admin", "ADMIN", false)
		}, "profile_role_valid"},
		{"duplicate email", func() error {
			_, err := pool.Exec(ctx, `INSERT INTO family (id, name, email, password_hash) VALUES ($1, 'F', 'a@example.com', 'x')`, uuid.Must(uuid.NewV7()))
			return err
		}, "family_email_key"},
		{"upper-case email", func() error {
			_, err := pool.Exec(ctx, `INSERT INTO family (id, name, email, password_hash) VALUES ($1, 'F', 'A@example.com', 'x')`, uuid.Must(uuid.NewV7()))
			return err
		}, "family_email_lower"},
		{"auto lock out of range", func() error {
			_, err := pool.Exec(ctx, `UPDATE family SET auto_lock_minutes = 31 WHERE id = $1`, f.family)
			return err
		}, "family_auto_lock_range"},
		{"duplicate profile name, other case", func() error {
			return execProfile(ctx, pool, uuid.Must(uuid.NewV7()), f.family, "OWNER", "CHILD", false)
		}, "profile_family_name"},
		{"upper-case contact email", func() error {
			_, err := pool.Exec(ctx, `UPDATE profile SET contact_email = 'Sam@x.com' WHERE id = $1`, f.owner)
			return err
		}, "profile_contact_email_lower"},
		{"profile session without family session", func() error {
			_, err := insertSession(ctx, pool, "profile", f.family, &f.owner, nil)
			return err
		}, "session_kind_shape"},
		{"family session with a profile", func() error {
			_, err := insertSession(ctx, pool, "family", f.family, &f.owner, nil)
			return err
		}, "session_kind_shape"},
		{"profile session for another family's profile", func() error {
			device, err := insertSession(ctx, pool, "family", f.family, nil, nil)
			if err != nil {
				return err
			}
			_, err = insertSession(ctx, pool, "profile", f.family, &f.foreign, &device)
			return err
		}, "session_profile_fkey"},
		{"second profile session on one device", func() error {
			_, err := insertSession(ctx, pool, "profile", f.family, &f.owner, &fs)
			return err
		}, "session_one_profile_per_device"},
		{"bad module id", func() error {
			_, err := pool.Exec(ctx, `INSERT INTO family_module (family_id, module_id, enabled) VALUES ($1, 'Meals', true)`, f.family)
			return err
		}, "family_module_id_format"},
		{"zero failed count", func() error {
			_, err := pool.Exec(ctx, `INSERT INTO pin_attempt (profile_id, failed_count, last_failed_at) VALUES ($1, 0, now())`, f.owner)
			return err
		}, "pin_attempt_count_positive"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			wantViolation(t, tt.run(), tt.constraint)
		})
	}
}

func TestSchemaCascades(t *testing.T) {
	t.Parallel()
	f := newSchemaFixture(t)
	ctx := t.Context()

	fs, err := insertSession(ctx, f.pool, "family", f.family, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := insertSession(ctx, f.pool, "profile", f.family, &f.owner, &fs); err != nil {
		t.Fatal(err)
	}
	// Deleting the family session takes its profile session with it.
	if _, err := f.pool.Exec(ctx, `DELETE FROM session WHERE id = $1`, fs); err != nil {
		t.Fatal(err)
	}
	if n := count(t, f.pool, `SELECT count(*) FROM session WHERE family_id = $1`, f.family); n != 0 {
		t.Errorf("%d sessions left after deleting the family session", n)
	}

	// Deleting the family removes everything that belongs to it.
	if _, err := f.pool.Exec(ctx, `INSERT INTO pin_attempt (profile_id, failed_count, last_failed_at) VALUES ($1, 1, now())`, f.owner); err != nil {
		t.Fatal(err)
	}
	if _, err := f.pool.Exec(ctx, `INSERT INTO family_module (family_id, module_id, enabled) VALUES ($1, 'meals', false)`, f.family); err != nil {
		t.Fatal(err)
	}
	if _, err := f.pool.Exec(ctx, `DELETE FROM family WHERE id = $1`, f.family); err != nil {
		t.Fatal(err)
	}
	for _, q := range []string{
		`SELECT count(*) FROM profile WHERE family_id = $1`,
		`SELECT count(*) FROM family_module WHERE family_id = $1`,
		`SELECT count(*) FROM pin_attempt a JOIN profile p ON p.id = a.profile_id WHERE p.family_id = $1`,
	} {
		if n := count(t, f.pool, q, f.family); n != 0 {
			t.Errorf("%s = %d after family delete", q, n)
		}
	}
	if n := count(t, f.pool, `SELECT count(*) FROM pin_attempt`); n != 0 {
		t.Errorf("pin_attempt rows left: %d", n)
	}
}

func TestSchemaRowLevelSecurityEnabled(t *testing.T) {
	t.Parallel()
	pool := testutil.NewDB(t)
	for _, table := range []string{"family", "profile", "pin_attempt", "session", "family_module"} {
		var enabled bool
		if err := pool.QueryRow(t.Context(), `SELECT relrowsecurity FROM pg_class WHERE relname = $1`, table).Scan(&enabled); err != nil {
			t.Fatalf("%s: %v", table, err)
		}
		if !enabled {
			t.Errorf("RLS not enabled on %s", table)
		}
	}
}

func count(t *testing.T, pool *pgxpool.Pool, query string, args ...any) int {
	t.Helper()
	var n int
	if err := pool.QueryRow(t.Context(), query, args...).Scan(&n); err != nil {
		t.Fatalf("%s: %v", query, err)
	}
	return n
}
