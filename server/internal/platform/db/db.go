// Package db opens the Postgres connection pool.
package db

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool settings sized for one small API instance. MaxConns stays well under
// hosted Postgres connection caps; lifetimes recycle connections so a
// failover or credential rotation is picked up without a restart.
const (
	maxConns          = 10
	minConns          = 1
	maxConnLifetime   = time.Hour
	maxConnIdleTime   = 30 * time.Minute
	healthCheckPeriod = time.Minute
	connectTimeout    = 5 * time.Second
	startupPingWait   = 5 * time.Second
)

// Option adjusts the pool configuration before it is created.
type Option func(*pgxpool.Config)

// WithTracer installs a pgx query tracer, e.g. the query counter tests use
// to hold handlers to their query budgets.
func WithTracer(t pgx.QueryTracer) Option {
	return func(c *pgxpool.Config) { c.ConnConfig.Tracer = t }
}

// Open creates a pool and pings it, so a bad DATABASE_URL or unreachable
// database fails at startup rather than on the first request. The caller
// owns the pool and must Close it.
func Open(ctx context.Context, databaseURL string, opts ...Option) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		// pgx's parse error can echo the URL, password included; drop it.
		return nil, errors.New("parse database url: invalid connection string")
	}
	cfg.MaxConns = maxConns
	cfg.MinConns = minConns
	cfg.MaxConnLifetime = maxConnLifetime
	cfg.MaxConnIdleTime = maxConnIdleTime
	cfg.HealthCheckPeriod = healthCheckPeriod
	cfg.ConnConfig.ConnectTimeout = connectTimeout
	for _, opt := range opts {
		opt(cfg)
	}

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, startupPingWait)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return pool, nil
}
