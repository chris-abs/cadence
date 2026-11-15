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
| `internal/authz` | Module catalogue, `Subject`, `Can`, `Require`, `RequireModule` |
| `internal/meals` | The meals module (only its catalogue entry so far) |
| `internal/api` | Types generated from `../api/openapi.yaml` |
| `internal/store` | sqlc query layer |
| `internal/platform/httpx` | `WriteJSON`, `WriteError`, `DecodeJSON`, error codes |
| `internal/platform/db` | `pgxpool` setup |
| `internal/platform/passhash` | bcrypt behind a `Hasher` interface (cost 12 in production) |
| `internal/platform/ratelimit` | In-memory per-key token buckets with an injectable clock |
| `internal/platform/testutil` | `NewDB(t)`, fake `Clock`, `QueryCounter` tracer |
| `db/migrations`, `db/queries` | goose SQL, sqlc SQL |

Feature packages (`internal/identity`, `internal/meals`) each own their handlers.

## Identity boundary (what feature modules may use)

Identity owns `family`, `profile`, `pin_attempt`, `session` and `family_module`.
Nothing outside `internal/identity` queries those tables; modules reference
`family(id)` / `profile(id)` only as foreign keys. A module gets everything else
through this interface:

1. **Catalogue entry.** Export one `authz.Module{ID, Name, Description,
   DefaultEnabled, Actions}` and add it to `catalogue()` in `internal/app/routes.go`.
   Built once at startup; permissions are `"<module>.<action>"`.
2. **Route wiring** in `app.NewHandler`:
   `ident.RequireProfile(authz.RequireModule("meals", logger)(handler))`.
   `RequireProfile` answers `401 family_session_required` / `profile_session_required`;
   `RequireModule` answers `403 module_disabled` while the family has it off.
3. **Caller.** `s, _ := authz.SubjectFrom(r.Context())` gives `s.FamilyID`,
   `s.ProfileID`, `s.Role`. Scope every query by `s.FamilyID`; set `created_by`
   from `s.ProfileID`.
4. **Checks.** `if err := authz.Require(ctx, "meals.recipes.edit"); err != nil`
   → `403 forbidden` (`errors.Is(err, authz.ErrForbidden)`). Zero allocations;
   the subject is rebuilt from the database on every request, so a demotion or a
   disabled module applies to the next request.

Per request the profile middleware spends one query on session + device +
profile + role + family and one on module settings; renewal writes at most once a
minute per session (none for `X-Cadence-Passive: 1`). bcrypt runs only on login,
password re-authentication and PIN entry.

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
- Inject `Deps.Hasher: passhash.NewBcrypt(bcrypt.MinCost)` and `Deps.Now:
  testutil.NewClock().Now` in tests; never lower `passhash.DefaultCost`.
- Identity tests use the harness in `internal/identity/harness_test.go` (devices
  with cookie jars, fixture families). Every new route needs rows in the
  authorisation matrix (`authz_test.go`); a coverage check walks `Handler.Patterns()`.
- Middleware benchmarks: `go test -run '^$' -bench Middleware -benchmem ./internal/identity/`.

## Commands

`make dev` · `make test` · `make check` (silent on success) · `make gen` · `make migrate` ·
`make migration name=x` · `make help`. `make migrate` refuses non-local hosts.
