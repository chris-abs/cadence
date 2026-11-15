package testutil

import (
	"sync"
	"time"
)

// Clock is a fake clock for tests: it stands still until Advance is called,
// so expiry and rate limits are tested without sleeping. Safe for concurrent
// use. Pass its Now method wherever production code takes a clock.
type Clock struct {
	mu  sync.Mutex
	now time.Time
}

// NewClock returns a Clock set to a fixed, realistic instant (truncated to
// microseconds, Postgres's timestamp precision, so round trips compare equal).
func NewClock() *Clock {
	return &Clock{now: time.Date(2026, 11, 15, 9, 0, 0, 0, time.UTC)}
}

// Now returns the current fake time.
func (c *Clock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.now
}

// Advance moves the clock forward by d.
func (c *Clock) Advance(d time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.now = c.now.Add(d)
}
