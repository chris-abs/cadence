package app

import (
	"net/netip"
	"reflect"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/identity"
)

const testDBURL = "postgres://u:secret@localhost:5433/db?sslmode=disable"

func envFrom(m map[string]string) func(string) string {
	return func(k string) string { return m[k] }
}

func TestLoadConfigDefaults(t *testing.T) {
	cfg, err := LoadConfig(envFrom(map[string]string{"DATABASE_URL": testDBURL}))
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	want := Config{Port: 8080, DatabaseURL: testDBURL, Env: EnvDevelopment, Registration: identity.RegistrationFirst}
	if !reflect.DeepEqual(cfg, want) {
		t.Errorf("got %+v, want %+v", cfg, want)
	}
	if cfg.Addr() != ":8080" {
		t.Errorf("Addr() = %q", cfg.Addr())
	}
}

func TestLoadConfigOverrides(t *testing.T) {
	cfg, err := LoadConfig(envFrom(map[string]string{
		"DATABASE_URL":       "postgresql://h/db",
		"PORT":               "9000",
		"APP_ENV":            "production",
		"ALLOW_REGISTRATION": "closed",
		"TRUSTED_PROXY":      "10.0.0.0/8, 192.168.1.7",
	}))
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	if cfg.Port != 9000 || cfg.Env != EnvProduction || cfg.DatabaseURL != "postgresql://h/db" ||
		cfg.Registration != identity.RegistrationClosed {
		t.Errorf("got %+v", cfg)
	}
	want := []netip.Prefix{netip.MustParsePrefix("10.0.0.0/8"), netip.MustParsePrefix("192.168.1.7/32")}
	if !reflect.DeepEqual(cfg.TrustedProxies, want) {
		t.Errorf("TrustedProxies = %v", cfg.TrustedProxies)
	}
}

func TestLoadConfigInvalid(t *testing.T) {
	tests := []struct {
		name    string
		env     map[string]string
		wantErr []string
	}{
		{"missing database url", map[string]string{}, []string{"DATABASE_URL is required"}},
		{"wrong scheme", map[string]string{"DATABASE_URL": "mysql://h/db"}, []string{"postgres:// URL"}},
		{"no host", map[string]string{"DATABASE_URL": "postgres:///db"}, []string{"postgres:// URL"}},
		{"port not a number", map[string]string{"DATABASE_URL": testDBURL, "PORT": "http"}, []string{"PORT"}},
		{"port out of range", map[string]string{"DATABASE_URL": testDBURL, "PORT": "70000"}, []string{"PORT"}},
		{"unknown env", map[string]string{"DATABASE_URL": testDBURL, "APP_ENV": "staging"}, []string{"APP_ENV"}},
		{"unknown registration mode", map[string]string{"DATABASE_URL": testDBURL, "ALLOW_REGISTRATION": "yes"}, []string{"ALLOW_REGISTRATION"}},
		{"bad proxy", map[string]string{"DATABASE_URL": testDBURL, "TRUSTED_PROXY": "proxy.local"}, []string{"TRUSTED_PROXY"}},
		{
			"all problems reported together",
			map[string]string{"PORT": "0", "APP_ENV": "prod"},
			[]string{"PORT", "DATABASE_URL", "APP_ENV"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := LoadConfig(envFrom(tt.env))
			if err == nil {
				t.Fatal("expected an error")
			}
			for _, want := range tt.wantErr {
				if !strings.Contains(err.Error(), want) {
					t.Errorf("error %q does not mention %q", err, want)
				}
			}
		})
	}
}

func TestLoadConfigNeverLeaksDatabaseURL(t *testing.T) {
	_, err := LoadConfig(envFrom(map[string]string{"DATABASE_URL": "mysql://u:hunter2@h/db"}))
	if err == nil || strings.Contains(err.Error(), "hunter2") {
		t.Errorf("error must exist and must not contain the password: %v", err)
	}
}
