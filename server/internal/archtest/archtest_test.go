// Package archtest checks the domain boundaries of the server (see
// server/CLAUDE.md, "Domain boundaries"): each domain's generated queries are
// private to it, and each domain's SQL touches only the tables it owns.
package archtest

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// serverRoot is the module root, relative to this package's directory.
const serverRoot = "../.."

// outsider is a package outside the identity domain that tries to use
// identity's generated queries.
const outsider = `package outsider

import _ "github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
`

// TestDomainDBIsPrivate: a package outside a domain cannot import that
// domain's db package. Go's internal/ rule enforces this at compile time for
// every build, so `make check` already fails on a violation; this test proves
// the rule applies by compiling an outsider that tries. The outsider exists
// only in a build overlay, so no uncompilable file sits in the tree for
// linters to trip over.
func TestDomainDBIsPrivate(t *testing.T) {
	t.Parallel()
	here, err := filepath.Abs(".")
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	src := filepath.Join(dir, "outsider.go")
	if err := os.WriteFile(src, []byte(outsider), 0o600); err != nil {
		t.Fatal(err)
	}
	overlay, err := json.Marshal(map[string]map[string]string{
		"Replace": {filepath.Join(here, "outsiderprobe", "outsider.go"): src},
	})
	if err != nil {
		t.Fatal(err)
	}
	overlayPath := filepath.Join(dir, "overlay.json")
	if err := os.WriteFile(overlayPath, overlay, 0o600); err != nil {
		t.Fatal(err)
	}
	cmd := exec.CommandContext(t.Context(), "go", "build", "-overlay", overlayPath, "./outsiderprobe")
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatal("a package outside identity imported identitydb; the db package must live under internal/identity/internal/")
	}
	if !strings.Contains(string(out), "use of internal package") {
		t.Fatalf("outsider failed for another reason:\n%s", out)
	}
}

// TestSQLCOutputIsDomainInternal: every sqlc entry generates into
// internal/<domain>/internal/<domain>db and reads queries from
// db/queries/<domain>, so the internal/ rule covers every domain.
func TestSQLCOutputIsDomainInternal(t *testing.T) {
	t.Parallel()
	raw, err := os.ReadFile(filepath.Join(serverRoot, "sqlc.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	queries := regexp.MustCompile(`(?m)^\s+queries:\s*(\S+)`).FindAllStringSubmatch(string(raw), -1)
	outs := regexp.MustCompile(`(?m)^\s+out:\s*(\S+)`).FindAllStringSubmatch(string(raw), -1)
	if len(queries) == 0 || len(queries) != len(outs) {
		t.Fatalf("sqlc.yaml: %d queries entries, %d out entries", len(queries), len(outs))
	}
	for i := range queries {
		domain := strings.TrimPrefix(queries[i][1], "db/queries/")
		want := "internal/" + domain + "/internal/" + domain + "db"
		if strings.Contains(domain, "/") || outs[i][1] != want {
			t.Errorf("sqlc entry %d: queries %s, out %s; want db/queries/<domain> and %s", i, queries[i][1], outs[i][1], want)
		}
	}
}

var (
	domainTag   = regexp.MustCompile(`(?m)^--\s*domain:\s*([a-z][a-z0-9_]*)`)
	createTable = regexp.MustCompile(`(?i)\bCREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_][a-z0-9_]*)`)
	tableRef    = regexp.MustCompile(`(?i)\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+([a-z_][a-z0-9_]*)`)
	lineComment = regexp.MustCompile(`--[^\n]*`)
)

// TestQueriesTouchOnlyOwnTables: every table is created in a migration tagged
// "-- domain: <name>", and the queries of db/queries/<name>/ reference only
// that domain's tables. Cross-domain needs go through the owning domain's Go
// API; foreign keys in migrations are the only allowed coupling.
func TestQueriesTouchOnlyOwnTables(t *testing.T) {
	t.Parallel()
	owner := tableOwners(t)

	dirs, err := os.ReadDir(filepath.Join(serverRoot, "db", "queries"))
	if err != nil {
		t.Fatal(err)
	}
	for _, d := range dirs {
		if !d.IsDir() {
			t.Errorf("db/queries/%s: queries must live in a per-domain directory", d.Name())
			continue
		}
		files, err := filepath.Glob(filepath.Join(serverRoot, "db", "queries", d.Name(), "*.sql"))
		if err != nil {
			t.Fatal(err)
		}
		for _, f := range files {
			sql := readSQL(t, f)
			for _, m := range tableRef.FindAllStringSubmatch(sql, -1) {
				table := strings.ToLower(m[1])
				if dom, ok := owner[table]; ok && dom != d.Name() {
					t.Errorf("%s references %s, which belongs to %s", rel(f), table, dom)
				}
			}
		}
	}
}

func tableOwners(t *testing.T) map[string]string {
	t.Helper()
	files, err := filepath.Glob(filepath.Join(serverRoot, "db", "migrations", "*.sql"))
	if err != nil {
		t.Fatal(err)
	}
	owner := map[string]string{}
	for _, f := range files {
		raw, err := os.ReadFile(f)
		if err != nil {
			t.Fatal(err)
		}
		tables := createTable.FindAllStringSubmatch(readSQL(t, f), -1)
		if len(tables) == 0 {
			continue
		}
		tag := domainTag.FindStringSubmatch(string(raw))
		if tag == nil {
			t.Errorf("%s creates tables but has no \"-- domain: <name>\" line", rel(f))
			continue
		}
		for _, m := range tables {
			owner[strings.ToLower(m[1])] = tag[1]
		}
	}
	if len(owner) == 0 {
		t.Fatal("found no tables in db/migrations")
	}
	return owner
}

// readSQL returns a file's SQL without line comments, so prose such as
// "-- reads from family" is not mistaken for a reference.
func readSQL(t *testing.T, path string) string {
	t.Helper()
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return lineComment.ReplaceAllString(string(raw), "")
}

func rel(path string) string { return strings.TrimPrefix(filepath.ToSlash(path), serverRoot+"/") }
