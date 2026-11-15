# Cadence server

Go API: stdlib `net/http`, pgx v5, sqlc, goose. Root rules in `../CLAUDE.md` apply.

## Layout

| Path | Job |
|---|---|
| `cmd/api` | `main`: load config, open DB, serve, shut down on SIGINT/SIGTERM |
| `internal/app` | Config, router (`routes.go`), middleware, HTTP server |
| `internal/health` | `GET /api/healthz` |
| `internal/api` | Types generated from `../api/openapi.yaml` |
| `internal/store` | sqlc query layer |
| `internal/platform/httpx` | `WriteJSON`, `WriteError`, `DecodeJSON` |
| `internal/platform/db` | `pgxpool` setup |
| `internal/platform/testutil` | `NewDB(t)`: a fresh migrated database per test |
| `db/migrations`, `db/queries` | goose SQL, sqlc SQL |

Feature packages (`internal/identity`, `internal/meals`) each own their handlers.

## Conventions

- Config comes from `app.LoadConfig` only; no other code reads env vars.
- Dependencies go in through constructors (`NewHandler(deps...)`). No globals, no `init()`.
- Routes register in `app.NewHandler` relative to `/api`, e.g. `"GET /healthz"`, matching the contract paths.
- Errors: wrap with context (`fmt.Errorf("load family: %w", err)`), never ignore. Log
  the cause; send the client only `httpx.WriteError` with a stable `httpx.Code*` code.
- Request bodies: `httpx.DecodeJSON`, then `httpx.WriteDecodeError` on failure.
- Pass `r.Context()` to every DB call. Handlers depend on small interfaces they define.
- Comments explain why. Prefer the standard library; new deps need a one-line reason.

## Generated: do not edit

`internal/api/types.gen.go` and `internal/store/*.gen.go`. Change the source, run `make gen`.
`make check` fails if they are stale. Merged migrations are also immutable: add a new one.

## Add an endpoint

1. Contract: add the path and schemas to `../api/openapi.yaml`.
2. `make gen` (from repo root it also regenerates client types).
3. Schema change? `make migration name=<what>`, write Up and Down, `make migrate`.
4. Queries: add SQL to `db/queries/<feature>.sql`, then `make gen`.
5. Handler in the feature package, using the generated request/response types.
6. Register the route in `internal/app/routes.go`.
7. Tests (below), then `make check`. Commit.

## Tests

- Needs local Postgres: `make db-up` at the root. `TEST_DATABASE_URL` overrides the server.
- `testutil.NewDB(t)` gives each test its own migrated database; call `t.Parallel()`.
- Handlers are tested through the real router: `app.NewHandler(app.Deps{...})` +
  `httptest`, decoding bodies strictly into the generated `internal/api` types
  (see `internal/app/routes_test.go`). Pure logic gets plain table-driven unit tests.

## Commands

`make dev` · `make test` · `make check` (silent on success) · `make gen` · `make migrate` ·
`make migration name=x` · `make help`. `make migrate` refuses non-local hosts.
