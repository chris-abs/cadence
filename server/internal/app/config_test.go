package app

import (
	"net/netip"
	"reflect"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/identity/auth"
)

func envFrom(m map[string]string) func(string) string {
	return func(k string) string { return m[k] }
}

func TestLoadConfig(t *testing.T) {
	cfg, err := LoadConfig(envFrom(map[string]string{"DATABASE_URL": "postgres://u:p@h/db"}))
	if err != nil {
		t.Fatal(err)
	}
	want := Config{Port: 8080, DatabaseURL: "postgres://u:p@h/db", Env: EnvDevelopment, Registration: auth.RegistrationFirst}
	if !reflect.DeepEqual(cfg, want) {
		t.Errorf("defaults: got %+v, want %+v", cfg, want)
	}
	cfg, err = LoadConfig(envFrom(map[string]string{
		"DATABASE_URL": "postgresql://h/db", "PORT": "9000", "APP_ENV": "production",
		"ALLOW_REGISTRATION": "closed", "TRUSTED_PROXY": "10.0.0.0/8, 192.168.1.7",
	}))
	if err != nil {
		t.Fatal(err)
	}
	proxies := []netip.Prefix{netip.MustParsePrefix("10.0.0.0/8"), netip.MustParsePrefix("192.168.1.7/32")}
	if cfg.Port != 9000 || cfg.Env != EnvProduction || cfg.Registration != auth.RegistrationClosed || !reflect.DeepEqual(cfg.TrustedProxies, proxies) {
		t.Errorf("overrides: got %+v", cfg)
	}
}

func TestLoadConfigReportsEveryProblemWithoutLeakingTheURL(t *testing.T) {
	_, err := LoadConfig(envFrom(map[string]string{
		"DATABASE_URL": "mysql://u:hunter2@h/db", "PORT": "0", "APP_ENV": "prod",
		"ALLOW_REGISTRATION": "yes", "TRUSTED_PROXY": "proxy.local",
	}))
	if err == nil {
		t.Fatal("expected an error")
	}
	for _, want := range []string{"DATABASE_URL", "PORT", "APP_ENV", "ALLOW_REGISTRATION", "TRUSTED_PROXY"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error does not mention %s: %v", want, err)
		}
	}
	if strings.Contains(err.Error(), "hunter2") {
		t.Errorf("error leaks the password: %v", err)
	}
}
