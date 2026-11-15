package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"syscall"

	"github.com/chris-abs/cadence/server/internal/app"
	"github.com/chris-abs/cadence/server/internal/platform/db"
)

func main() {
	if err := runWithSignals(); err != nil {
		fmt.Fprintln(os.Stderr, "admin:", err)
		os.Exit(1)
	}
}

func runWithSignals() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	return run(ctx, os.Args[1:], os.Stdout, os.Stderr, os.Getenv)
}

type passwordResetter interface {
	ResetPassword(ctx context.Context, email string) (string, error)
}

const usage = "usage: admin reset-password -email <family email>"

func run(ctx context.Context, args []string, stdout, stderr io.Writer, getenv func(string) string) error {
	if len(args) == 0 || args[0] != "reset-password" {
		return errors.New(usage)
	}
	email, err := parseResetArgs(args[1:], stderr)
	if err != nil {
		return err
	}
	cfg, err := app.LoadConfig(getenv)
	if err != nil {
		return err
	}
	pool, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	defer pool.Close()
	svc, err := app.NewAuthService(app.Deps{Logger: app.NewLogger(stderr, cfg.Env), DB: pool, Env: cfg.Env})
	if err != nil {
		return err
	}
	return resetPassword(ctx, svc, email, stdout)
}

func parseResetArgs(args []string, stderr io.Writer) (string, error) {
	fs := flag.NewFlagSet("reset-password", flag.ContinueOnError)
	fs.SetOutput(stderr)
	email := fs.String("email", "", "the family's sign-in email")
	if err := fs.Parse(args); err != nil {
		return "", fmt.Errorf("%w\n%s", err, usage)
	}
	if *email == "" || fs.NArg() != 0 {
		return "", errors.New(usage)
	}
	return *email, nil
}

func resetPassword(ctx context.Context, svc passwordResetter, email string, out io.Writer) error {
	password, err := svc.ResetPassword(ctx, email)
	if err != nil {
		return fmt.Errorf("reset password: %w", err)
	}
	_, err = fmt.Fprintf(out, "New family password: %s\n"+
		"Every device has been signed out. Give this to the owner privately and ask them\n"+
		"to sign in and change it under Family settings.\n", password)
	if err != nil {
		return fmt.Errorf("print password: %w", err)
	}
	return nil
}
