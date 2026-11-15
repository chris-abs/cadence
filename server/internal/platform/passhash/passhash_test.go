package passhash_test

import (
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/chris-abs/cadence/server/internal/platform/passhash"
)

func TestBcryptRoundTrip(t *testing.T) {
	t.Parallel()
	h := passhash.NewBcrypt(bcrypt.MinCost)
	hash, err := h.Hash("correct horse")
	if err != nil {
		t.Fatal(err)
	}
	if ok, err := h.Matches(hash, "correct horse"); err != nil || !ok {
		t.Errorf("Matches(right) = %v, %v", ok, err)
	}
	if ok, err := h.Matches(hash, "wrong horse"); err != nil || ok {
		t.Errorf("Matches(wrong) = %v, %v", ok, err)
	}
	if _, err := h.Matches("not-a-hash", "x"); err == nil {
		t.Error("a malformed hash must be an error, not a mismatch")
	}
}

func TestBcryptRefusesToTruncate(t *testing.T) {
	t.Parallel()
	if _, err := passhash.NewBcrypt(bcrypt.MinCost).Hash(strings.Repeat("a", 73)); err == nil {
		t.Error("73-byte secret must be rejected")
	}
}
