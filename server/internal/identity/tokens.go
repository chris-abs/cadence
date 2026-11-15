package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
)

// tokenBytes is the session token's entropy (spec §3). At 256 bits a token
// cannot be guessed, so a fast sha256 is the right storage hash; bcrypt would
// only slow every request down.
const tokenBytes = 32

// TokenSource mints session tokens. Production uses crypto/rand; tests may
// inject a deterministic reader.
type TokenSource struct {
	r io.Reader
}

// NewTokenSource returns tokens read from r; nil means crypto/rand.
func NewTokenSource(r io.Reader) TokenSource {
	if r == nil {
		r = rand.Reader
	}
	return TokenSource{r: r}
}

// New returns a fresh token (base64url, for the cookie) and its storage hash.
func (t TokenSource) New() (token string, hash []byte, err error) {
	raw := make([]byte, tokenBytes)
	if _, err := io.ReadFull(t.r, raw); err != nil {
		return "", nil, fmt.Errorf("read random token: %w", err)
	}
	sum := sha256.Sum256(raw)
	return base64.RawURLEncoding.EncodeToString(raw), sum[:], nil
}

// hashToken returns the storage hash of a cookie value, or false when the
// value cannot be one of our tokens, which saves a database round trip.
func hashToken(token string) ([]byte, bool) {
	if base64.RawURLEncoding.DecodedLen(len(token)) != tokenBytes {
		return nil, false
	}
	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(raw) != tokenBytes {
		return nil, false
	}
	sum := sha256.Sum256(raw)
	return sum[:], true
}
