# Cadence server

Go API: stdlib `net/http`, pgx v5, sqlc, goose. Root rules in `../CLAUDE.md` apply.

## Layout

| Path | Job |
|---|---|
| `cmd/api` | `main`: load config, open DB, serve, run the session sweep, shut down on SIGINT/SIGTERM |
| `cmd/admin` | Operator tasks: `reset-password` for a forgotten family password (`make reset-password email=…`) |
| `internal/app` | Config, router (`routes.go`, 404/405/415 fallbacks), middleware, HTTP server |
| `internal/health` | `GET /api/healthz` |
| `internal/identity` | Family, profiles, sessions, PINs, devices, module settings (`docs/spec/identity.md`) |
| `internal/identity/internal/identitydb` | Identity's sqlc queries; importable only from `internal/identity/...` |
| `internal/authz` | Module catalogue, `Subject`, `Can`, `Require`, `RequireModule` |
| `internal/meals` | The meals module (only its catalogue entry so far) |
| `internal/api` | Types generated from `../api/openapi.yaml` |
| `internal/platform/httpx` | `WriteJSON`, `WriteError`, `DecodeJSON`, error codes, `Route` |
| `internal/platform/db` | `pgxpool` setup |
| `internal/platform/passhash` | bcrypt behind a `Hasher` interface (cost 12 in production) |
| `internal/platform/ratelimit` | In-memory per-key token buckets with an injectable clock |
| `internal/platform/testutil` | `NewDB(t)`, fake `Clock`, `QueryCounter` tracer |
| `internal/archtest` | Tests that enforce the domain boundaries below |
| `db/migrations` | goose SQL, one ordered history for all domains |
| `db/queries/<domain>/` | sqlc SQL, one directory per domain |

Feature packages (`internal/identity`, `internal/meals`) each own their handlers.

## Domain boundaries

- **A table belongs to exactly one domain.** The migration that creates it says
  `-- domain: <name>`. Only `db/queries/<name>/` may query it.
- **Each domain owns its generated queries privately.** `sqlc.yaml` has one
  entry per domain, generating into `internal/<name>/internal/<name>db`. Go's
  `internal/` rule makes that package importable only from inside the domain, so
  the compiler rejects any other importer.
- **Cross-domain needs go through the owning domain's exported Go API**, never
  its tables or row types. The only database-level coupling allowed is a foreign
  key to `family(id)` or `profile(family_id, id)` (composite, so a row cannot point
  at another family's profile).
- **Guarded by `make check-server`** (`internal/archtest`): an outsider importing
  `identitydb` fails to compile; every sqlc `out` is domain-internal; every query
  file references only its own domain's tables; identity's exported API (`go doc`)
  never mentions `identitydb`.
- **Routes:** each domain exposes `Routes() []httpx.Route`; `app.NewHandler`
  concatenates them, so the authorisation matrix sees every route.

## Identity API for module authors

Identity owns `family`, `profile`, `pin_attempt`, `session` and `family_module`.
A module uses only this:

| From | Use | For |
|---|---|---|
| `authz` | `Module`, `Action`, `Role` (`Parent`, `Child`) | The module's catalogue entry: export one `authz.Module` and add it to `catalogue()` in `internal/app/routes.go` |
| `authz` | `SubjectFrom(ctx)` → `Subject{FamilyID, ProfileID, Role, IsOwner}` | Scope every query by `FamilyID`; set `created_by` from `ProfileID` |
| `authz` | `Require(ctx, "meals.recipes.edit")` → `ErrForbidden` | Per-action checks in handlers (403 `forbidden`); 0 allocations |
| `authz` | `RequireModule("meals", logger)` | Middleware: 403 `module_disabled` while the family has it off |
| `identity` | `(*Handler).RequireProfile` | Middleware: 401 `family_session_required` / `profile_session_required`; puts the caller in the context |
| `identity` | `CallerFrom(ctx)` → `Caller{Family{ID, Name, AutoLockMinutes}, Profile{ID, FamilyID, Name, Role, IsOwner, Timezone}, Subject}` | Display name or time zone of the caller (e.g. "today" in their zone) |

Wiring a module route in `app.NewHandler`:

```go
ident.RequireProfile(authz.RequireModule("meals", d.Logger)(mealsHandler))
```

Everything else in `identity` (the service, sessions, rows) is for `app` and
`cmd/admin` only. Rights are read from the database on every request, so a
demotion or a disabled module applies to the next request. Per request the
profile middleware spends one query on session + device + profile + role +
family and one on module settings; renewal writes at most once a minute per
session (none for `X-Cadence-Passive: 1`). bcrypt runs only on login, password
re-authentication and PIN entry.

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

`internal/api/types.gen.go` and `internal/*/internal/*db/*.gen.go`. Change the source, run `make gen`.
`make check` fails if they are stale. Merged migrations are also immutable: add a new one.

## Add an endpoint

1. Contract: add the path and schemas to `../api/openapi.yaml`.
2. `make gen` (from repo root it also regenerates client types).
3. Schema change? `make migration name=<what>`, write Up and Down, `make migrate`.
4. Queries: add SQL to `db/queries/<domain>/<topic>.sql` (a new domain also gets a
   `sqlc.yaml` entry and `-- domain:` lines in its migrations), then `make gen`.
5. Handler in the feature package, using the generated request/response types.
6. Return it from the domain's `Routes() []httpx.Route`; a new domain's routes are
   appended in `internal/app/routes.go`.
7. Tests (below), then `make check`. Commit.

## Tests

- Needs local Postgres: `make db-up` at the root. `TEST_DATABASE_URL` overrides the server.
- `testutil.NewDB(t)` gives each test its own migrated database; call `t.Parallel()`.
- Handlers are tested through the real router: `app.NewHandler(app.Deps{...})` +
  `httptest`, decoding bodies strictly into the generated `internal/api` types
  (see `internal/app/routes_test.go`). Pure logic gets plain table-driven unit tests.
- Inject `Deps.Hasher: passhash.NewBcrypt(bcrypt.MinCost)` and `Deps.Now:
  testutil.NewClock().Now` in tests; never lower `passhash.DefaultCost`.
- Identity tests use the harness in `internal/identity/harness_test.go` (devices
  with cookie jars, fixture families). Every new route needs rows in the
  authorisation matrix (`authz_test.go`); a coverage check walks `Handler.Patterns()`.
- Middleware benchmarks: `go test -run '^$' -bench Middleware -benchmem ./internal/identity/`.

## Commands

`make dev` · `make test` · `make check` (silent on success) · `make gen` · `make migrate` ·
`make migration name=x` · `make help`. `make migrate` refuses non-local hosts.
