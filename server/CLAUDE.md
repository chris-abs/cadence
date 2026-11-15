# Cadence server

Go API: stdlib `net/http`, pgx v5, sqlc, goose. Root rules in `../CLAUDE.md` apply.

## Layout

| Path | Job |
|---|---|
| `cmd/api` | Load config, open the DB, serve, run the hourly session sweep |
| `cmd/admin` | `reset-password` for a forgotten family password |
| `internal/app` | Config, service wiring and every route in `routes.go`, HTTP server |
| `internal/auth` | Register, login, logout, family and profile sessions, devices, password change |
| `internal/family` | Family account, settings, module catalogue and toggles, family delete |
| `internal/profile` | Profiles, roles, ownership transfer, PINs and PIN lockout |
| `internal/middleware` | Cookies, session and module checks, error responses, rate limiter, client IP, HTTP chain |
| `internal/models` | Shared types: `Role`, `Caller`, `Device`, permissions, `Module`, shared errors and validation |
| `internal/platform` | `db` (pool, `InTx`, `DBTX`), `httpx` (JSON in/out, error codes), `passhash`, `testutil` |
| `internal/api` | Types generated from `../api/openapi.yaml` |
| `db/migrations`, `db/queries/<domain>/` | goose SQL; sqlc SQL per domain |

## Domains

- One package per domain, one file per layer: `handler.go` (HTTP only), `service.go`
  (rules), `repository.go` (the only code touching the domain's tables), `model.go`
  (types, validation). A further file only for a separate concern with an obvious
  name (`family/module_catalogue.go`). No `http_*.go`, `utils.go` or `helpers.go`.
- Dependencies point one way: `app` → `auth` → `family`, `profile` → `middleware` →
  `models`; `platform` sits under everything and `models` imports nothing internal.
  `family` and `profile` never import each other; a need across them is
  a small interface in the consumer, passed to its constructor (no setters).
- `auth` owns flows that span domains and runs them in one transaction by building
  each domain's `NewRepository(tx)`.
- Tables: `family`, `family_module` → family; `profile`, `pin_attempt` → profile;
  `session` → auth. sqlc generates into `internal/<domain>/internal/<domain>db`. The
  session lookup and device list join `profile`; keep cross-owner joins that rare.
- Routes are wired only in `internal/app/routes.go`, wrapped in `RequireFamily`,
  `RequireProfile` or nothing. Handlers return errors; `middleware.Handle` maps them.
- Permissions: `models.Caller.Can(perm)`. Module routes add `middleware.RequireModule(id, log)`.

## Conventions

- Config comes from `app.LoadConfig` only. No globals, no `init()`.
- Wrap errors with context; send clients only stable `httpx.Code*` codes.
- Comments: none by default; one line only where the reason cannot be read from the code.

## Generated: do not edit

`internal/api/types.gen.go` and `internal/*/internal/*db/*.gen.go`. Change the source,
run `make gen`; `make check` fails if they are stale. Merged migrations are immutable.

## Tests

- Core function only: a planned list per domain, one test per behaviour, nothing that
  adds no functional coverage. No role × action tables, benchmarks, query-count,
  schema or message-wording tests.
- Domain tests go through the real router with `testutil.NewServer` (fresh migrated
  database, fake clock, low-cost bcrypt) and `Device` (cookie jar, `Register`, `Login`,
  `Select`, `CreateProfile`, `Join`). Needs `make db-up`; call `t.Parallel()`.

## Commands

`make dev` · `make test` · `make check` (silent on success) · `make gen` · `make migrate` ·
`make migration name=x` · `make help`. `make migrate` refuses non-local hosts.
