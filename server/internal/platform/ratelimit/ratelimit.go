// Package ratelimit is an in-memory, per-key token bucket built on
// golang.org/x/time/rate. It suits one API instance (spec §6.2); limits reset
// on restart, which is acceptable because the security-critical PIN lockout is
// stored in the database instead.
package ratelimit

import (
	"math"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// sweepEvery bounds how often idle keys are pruned. Pruning runs inline on
// calls, so there is no background goroutine to manage.
const sweepEvery = time.Minute

// Limiter allows `burst` events per key at once, refilling one every
// `interval`. Every method takes the time from the injected clock, so tests
// advance a fake clock instead of sleeping.
type Limiter struct {
	limit rate.Limit
	burst int
	now   func() time.Time

	mu        sync.Mutex
	buckets   map[string]*rate.Limiter
	lastSweep time.Time
}

// New returns a Limiter refilling one token per interval up to burst.
func New(interval time.Duration, burst int, now func() time.Time) *Limiter {
	return &Limiter{
		limit:   rate.Every(interval),
		burst:   burst,
		now:     now,
		buckets: make(map[string]*rate.Limiter),
	}
}

// Allow spends one token for key. When none is left it returns false and how
// long until one is.
func (l *Limiter) Allow(key string) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	b := l.bucket(key, now)
	if b.AllowN(now, 1) {
		return true, 0
	}
	return false, l.wait(b, now)
}

// Check reports whether key has a token left without spending it. Pair it
// with Fail for limits that count failures only.
func (l *Limiter) Check(key string) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	b, ok := l.buckets[key]
	if !ok || b.TokensAt(now) >= 1 {
		return true, 0
	}
	return false, l.wait(b, now)
}

// Fail spends one token for key. An exhausted key stays exhausted; it does
// not go into debt.
func (l *Limiter) Fail(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	l.bucket(key, now).AllowN(now, 1)
}

// bucket returns key's limiter, creating it full. Callers hold l.mu.
func (l *Limiter) bucket(key string, now time.Time) *rate.Limiter {
	l.sweep(now)
	b, ok := l.buckets[key]
	if !ok {
		b = rate.NewLimiter(l.limit, l.burst)
		l.buckets[key] = b
	}
	return b
}

// sweep drops buckets that have refilled completely: forgetting them is
// indistinguishable from keeping them, and it bounds memory to keys that were
// active recently. Callers hold l.mu.
func (l *Limiter) sweep(now time.Time) {
	if now.Sub(l.lastSweep) < sweepEvery {
		return
	}
	l.lastSweep = now
	for k, b := range l.buckets {
		if b.TokensAt(now) >= float64(l.burst) {
			delete(l.buckets, k)
		}
	}
}

func (l *Limiter) wait(b *rate.Limiter, now time.Time) time.Duration {
	missing := 1 - b.TokensAt(now)
	secs := missing / float64(l.limit)
	return time.Duration(math.Ceil(secs * float64(time.Second)))
}
