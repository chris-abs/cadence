// Command api runs the Cadence HTTP API.
package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/platform/db"
)

func main() {
	if err := run(); err != nil {
		// The logger may not exist yet (bad config), so report on stderr.
		fmt.Fprintln(os.Stderr, "api:", err)
		os.Exit(1)
	}
}

// run holds everything main would, so deferred cleanup runs before exit.
func run() error {
	// ctx is cancelled on the first SIGINT/SIGTERM. Releasing the signal
	// handler straight away means a second signal kills the process the
	// default way, so a hung shutdown can still be interrupted.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		stop()
	}()

	cfg, err := app.LoadConfig(os.Getenv)
	if err != nil {
		return err
	}
	logger := app.NewLogger(os.Stdout, cfg.Env)

	pool, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	defer pool.Close()

	handler := app.NewHandler(app.Deps{Logger: logger, DB: pool, Env: cfg.Env})
	srv := app.NewServer(handler, logger)

	var lc net.ListenConfig
	ln, err := lc.Listen(ctx, "tcp", cfg.Addr())
	if err != nil {
		return fmt.Errorf("listen on %s: %w", cfg.Addr(), err)
	}
	logger.InfoContext(ctx, "api listening", "addr", ln.Addr().String(), "env", cfg.Env)

	if err := app.Serve(ctx, srv, ln); err != nil {
		return err
	}
	logger.InfoContext(ctx, "api stopped")
	return nil
}
