// Package db embeds the SQL migrations so tests (and, later, tooling) get the
// exact files `make migrate` applies, without depending on the working
// directory. The server binary never applies them: migrations run only via
// `make migrate`.
package db

import "embed"

// Migrations holds db/migrations/*.sql; use "migrations" as the directory.
//
//go:embed migrations/*.sql
var Migrations embed.FS
