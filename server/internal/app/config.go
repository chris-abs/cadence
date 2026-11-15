package app

import (
	"errors"
	"fmt"
	"net/url"
	"strconv"
)

// Env names the deployment environment. It switches behaviour that must differ
// between a laptop and the internet, such as log format and HSTS.
type Env string

const (
	EnvDevelopment Env = "development"
	EnvTest        Env = "test"
	EnvProduction  Env = "production"
)

// Config is everything the API reads from the environment. It is parsed once at
// startup and passed down explicitly; nothing else in the server reads env vars.
type Config struct {
	Port        int
	DatabaseURL string
	Env         Env
}

// LoadConfig builds a Config from getenv (os.Getenv in main, a map in tests) and
// reports every problem at once so a misconfigured deploy fails with one message.
func LoadConfig(getenv func(string) string) (Config, error) {
	cfg := Config{Port: 8080, Env: EnvDevelopment}
	var errs []error

	if v := getenv("PORT"); v != "" {
		port, err := strconv.Atoi(v)
		if err != nil || port < 1 || port > 65535 {
			errs = append(errs, fmt.Errorf("PORT must be an integer between 1 and 65535, got %q", v))
		} else {
			cfg.Port = port
		}
	}

	cfg.DatabaseURL = getenv("DATABASE_URL")
	if err := validateDatabaseURL(cfg.DatabaseURL); err != nil {
		errs = append(errs, err)
	}

	if v := getenv("APP_ENV"); v != "" {
		switch env := Env(v); env {
		case EnvDevelopment, EnvTest, EnvProduction:
			cfg.Env = env
		default:
			errs = append(errs, fmt.Errorf("APP_ENV must be one of development, test, production, got %q", v))
		}
	}

	if err := errors.Join(errs...); err != nil {
		return Config{}, fmt.Errorf("invalid config: %w", err)
	}
	return cfg, nil
}

// validateDatabaseURL checks the shape only; whether the database is reachable
// is checked by the startup ping. Messages never echo the value because it
// carries a password.
func validateDatabaseURL(raw string) error {
	if raw == "" {
		return errors.New("DATABASE_URL is required")
	}
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "postgres" && u.Scheme != "postgresql") || u.Host == "" {
		return errors.New("DATABASE_URL must be a postgres:// URL with a host")
	}
	return nil
}

// Addr is the listen address for the HTTP server.
func (c Config) Addr() string {
	return ":" + strconv.Itoa(c.Port)
}
