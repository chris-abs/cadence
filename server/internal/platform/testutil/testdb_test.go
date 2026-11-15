package testutil

import "testing"

func TestServerConfigParsesOverride(t *testing.T) {
	t.Setenv(EnvTestDatabaseURL, "postgres://alice:pw@db.local:6543/main?sslmode=disable")
	got := serverConfig(t)
	if got.Host != "db.local" || got.Port != "6543" || got.User != "alice" ||
		got.Password != "pw" || got.Database != "main" || got.Options != "sslmode=disable" {
		t.Errorf("got %+v", got)
	}
}

func TestURLDefaultsToLocalDocker(t *testing.T) {
	t.Setenv(EnvTestDatabaseURL, "")
	if URL() != defaultTestDatabaseURL {
		t.Errorf("URL() = %q", URL())
	}
}
