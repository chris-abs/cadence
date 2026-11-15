package middleware

import (
	"math"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

const sweepEvery = time.Minute

type RateLimiter struct {
	limit rate.Limit
	burst int
	now   func() time.Time

	mu        sync.Mutex
	buckets   map[string]*rate.Limiter
	lastSweep time.Time
}

func NewRateLimiter(interval time.Duration, burst int, now func() time.Time) *RateLimiter {
	return &RateLimiter{
		limit:   rate.Every(interval),
		burst:   burst,
		now:     now,
		buckets: make(map[string]*rate.Limiter),
	}
}

func (l *RateLimiter) Allow(key string) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	b := l.bucket(key, now)
	if b.AllowN(now, 1) {
		return true, 0
	}
	return false, l.wait(b, now)
}

func (l *RateLimiter) Check(key string) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	b, ok := l.buckets[key]
	if !ok || b.TokensAt(now) >= 1 {
		return true, 0
	}
	return false, l.wait(b, now)
}

func (l *RateLimiter) Fail(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	l.bucket(key, now).AllowN(now, 1)
}

func (l *RateLimiter) bucket(key string, now time.Time) *rate.Limiter {
	l.sweep(now)
	b, ok := l.buckets[key]
	if !ok {
		b = rate.NewLimiter(l.limit, l.burst)
		l.buckets[key] = b
	}
	return b
}

func (l *RateLimiter) sweep(now time.Time) {
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

func (l *RateLimiter) wait(b *rate.Limiter, now time.Time) time.Duration {
	missing := 1 - b.TokensAt(now)
	secs := missing / float64(l.limit)
	return time.Duration(math.Ceil(secs * float64(time.Second)))
}
