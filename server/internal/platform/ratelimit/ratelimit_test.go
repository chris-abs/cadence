package ratelimit_test

import (
	"testing"
	"time"

	"github.com/chris-abs/cadence/server/internal/platform/ratelimit"
	"github.com/chris-abs/cadence/server/internal/platform/testutil"
)

func TestAllowBurstThenRefill(t *testing.T) {
	t.Parallel()
	clock := testutil.NewClock()
	l := ratelimit.New(30*time.Second, 5, clock.Now) // login per IP: 10 / 5 min, burst 5

	for i := range 5 {
		if ok, _ := l.Allow("ip"); !ok {
			t.Fatalf("attempt %d refused within the burst", i+1)
		}
	}
	ok, wait := l.Allow("ip")
	if ok || wait != 30*time.Second {
		t.Fatalf("6th attempt = %v, wait %s; want refused, 30s", ok, wait)
	}
	if ok, _ := l.Allow("other-ip"); !ok {
		t.Error("keys must be independent")
	}
	clock.Advance(30 * time.Second)
	if ok, _ := l.Allow("ip"); !ok {
		t.Error("a token must be back after one interval")
	}
}

func TestCheckAndFailCountOnlyFailures(t *testing.T) {
	t.Parallel()
	clock := testutil.NewClock()
	l := ratelimit.New(3*time.Minute, 5, clock.Now)

	for range 10 {
		if ok, _ := l.Check("family"); !ok {
			t.Fatal("Check must not spend tokens")
		}
	}
	for range 5 {
		l.Fail("family")
	}
	ok, wait := l.Check("family")
	if ok || wait <= 0 || wait > 3*time.Minute {
		t.Fatalf("after 5 failures Check = %v, wait %s", ok, wait)
	}
	clock.Advance(wait)
	if ok, _ := l.Check("family"); !ok {
		t.Error("the reported wait must be enough")
	}
}

func TestIdleKeysAreForgotten(t *testing.T) {
	t.Parallel()
	clock := testutil.NewClock()
	l := ratelimit.New(time.Second, 1, clock.Now)
	l.Allow("a")
	clock.Advance(time.Hour)
	// The sweep runs inside the next call; a refilled "a" behaves as new.
	if ok, _ := l.Allow("b"); !ok {
		t.Fatal("b refused")
	}
	if ok, _ := l.Allow("a"); !ok {
		t.Error("a must be allowed again after refilling")
	}
}
