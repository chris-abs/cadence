package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/platform/db"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "api:", err)
		os.Exit(1)
	}
}

func run() error {
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

	handler, err := app.NewHandler(app.Deps{
		Logger: logger, DB: pool, Env: cfg.Env,
		Registration: cfg.Registration, TrustedProxies: cfg.TrustedProxies, OpenAPIPath: cfg.OpenAPIPath,
	})
	if err != nil {
		return err
	}
	srv := app.NewServer(handler, logger)

	var background sync.WaitGroup
	bgCtx, stopBackground := context.WithCancel(ctx)
	background.Go(func() { handler.RunCleanup(bgCtx) })
	defer func() {
		stopBackground()
		background.Wait()
	}()

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
