package db_test

import (
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/platform/db"
)

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
