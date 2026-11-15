package ratelimit_test

import (
	"testing"
	"time"

	"github.com/chris-abs/cadence/server/internal/platform/ratelimit"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

func TestRateLimiter(t *testing.T) {
	t.Parallel()
	clock := testutil.NewClock()
	l := ratelimit.New(time.Minute, 2, clock.Now)
	l.Allow("k")
	l.Allow("k")
	if ok, wait := l.Allow("k"); ok || wait != time.Minute {
		t.Errorf("third in burst: %v %s", ok, wait)
	}
	if ok, _ := l.Allow("other"); !ok {
		t.Error("keys must not share a bucket")
	}
	clock.Advance(time.Minute)
	if ok, _ := l.Allow("k"); !ok {
		t.Error("no refill after the interval")
	}
	if ok, _ := l.Check("f"); !ok {
		t.Error("Check must not spend")
	}
	l.Fail("f")
	l.Fail("f")
	if ok, _ := l.Check("f"); ok {
		t.Error("Check after two failures")
	}
}
