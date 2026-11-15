package testutil

import (
	"context"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5"
)

// QueryCounter is a pgx tracer that records the SQL statements a pool runs,
// so tests can assert per-request query budgets. Install it with
// NewDB(t, db.WithTracer(counter)). Safe for concurrent use.
type QueryCounter struct {
	mu   sync.Mutex
	sqls []string
}

// TraceQueryStart implements pgx.QueryTracer.
func (c *QueryCounter) TraceQueryStart(ctx context.Context, _ *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.sqls = append(c.sqls, data.SQL)
	return ctx
}

// TraceQueryEnd implements pgx.QueryTracer.
func (c *QueryCounter) TraceQueryEnd(context.Context, *pgx.Conn, pgx.TraceQueryEndData) {}

// Reset forgets everything recorded so far.
func (c *QueryCounter) Reset() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.sqls = nil
}

// Queries returns the statements recorded since the last Reset, with
// transaction control (begin/commit/rollback) left out: the budgets count
// data queries.
func (c *QueryCounter) Queries() []string {
	c.mu.Lock()
	defer c.mu.Unlock()
	var out []string
	for _, q := range c.sqls {
		switch strings.ToLower(strings.TrimSpace(q)) {
		case "begin", "commit", "rollback":
			continue
		}
		out = append(out, q)
	}
	return out
}
