# Cadence rebuild — reviewed plan

Status: in progress. Amended by `docs/decisions/0001-foundations.md` (Supabase moves to straight after M1; multi-machine from day one). Legacy was read only (no `.env` contents were read).

## 1. Verdict

The direction is right: rebuild, keep the two-step family → profile login, drop everything else, focus on meals. The stack proposal is sound. I disagree on six points:

| # | Proposal | My position | Why |
|---|---|---|---|
| 1 | Supabase project first, meal spec second, scaffold third | Scaffold first; spec in parallel; Supabase only at the deploy milestone | Nothing in scaffold or auth depends on the spec or on Supabase. Local Docker Postgres covers all dev and tests. |
| 2 | Supabase "as Postgres only" | Fine, but must lock down the Data API | Supabase serves the `public` schema over REST using the project's public key. Tables without RLS are readable by anyone holding that key. Disable the Data API and enable RLS (no policies) on every table. |
| 3 | golang-jwt v5 tokens, client-side storage | Opaque server-side sessions in httpOnly cookies | Legacy tokens cannot be revoked and carry the role for 24h. A session row gives real logout, live role checks, and instant invalidation on PIN/password change. Same flow and lifetimes; no JWT library needed. |
| 4 | Hand-written queries implied | sqlc | SQL is written once, Go is generated and compile-checked. Less code for AI to write and review. |
| 5 | Client and server share nothing | One `api/openapi.yaml` contract, types generated both sides | Stops drift, lets client and server be built in parallel, and is the seam for a later repo split. |
| 6 | `family` and `profile` as separate packages | One `identity` package | They are one bounded context (registration writes both). Merging removes the circular dependency instead of patching it. |

Smaller disagreements: drop `pg_trgm` (a household's recipes do not need trigram indexes; add later if search is slow); drop blanket soft-delete; drop the atoms/molecules/organisms taxonomy in favour of shadcn's `components/ui` plus feature folders; defer S3 and SES until a milestone needs them.

## 2. Legacy issues — verified

### Claims checked

| Claim | Result | Evidence / correction |
|---|---|---|
| PINs plaintext, compared with `!=` | Confirmed | `profile/service.go:143`, `:215`; column `pin VARCHAR(6)` |
| CHILD can PATCH own role to PARENT | **Wrong** | `profile/handler.go:194-203` blocks self role change and non-parent role changes. The service (`:117`) only protects the owner, so the handler is the sole guard. |
| `POST /profiles` needs only family token | Confirmed, and worse | `profile/handler.go:30`. See token confusion below: a CHILD's profile token is also accepted here. |
| No rate limiting | Confirmed | None anywhere |
| golang-jwt v3 | Confirmed | `v3.2.2+incompatible` |
| CORS `*` + credentials + Debug | Confirmed, lower severity | `api/server.go:45-52`. Tokens travel in headers, not cookies, so it is misconfiguration rather than a live exploit. |
| Zero tests | Confirmed | 0 test files in server and client |
| Registration not transactional | Confirmed | `family/service.go:64-98`, three separate writes |
| No input validation | Mostly confirmed | Only colour, timezone, and PIN-on-update are validated. PIN on create is not validated at all. |
| ~90 unchecked context lookups | Confirmed | Exactly 90, none checked |
| `writeJSON` in 13 packages | Confirmed | 13 |
| Circular dependency via setter | Confirmed | `family/service.go:29`, `api/server.go:81` |
| API URL hardcoded in 3 places | Confirmed | 3 occurrences in 2 files (`Global/utils/api.ts`, `Global/hooks/useAuth.ts`) |
| Tokens in localStorage | Confirmed | Plus a spoofable `isAuthenticated` flag |
| `pg_trgm` fresh-DB bug | Confirmed for committed code | An untracked `docker/postgres-init` script patches it locally only. It would still fail on Supabase. |

### Missed — important

| Issue | Evidence | Impact |
|---|---|---|
| **`.env` is in public git history** | `cadence-api` is PUBLIC; `.env` added 2025-01-03 (`9720ce3`), deleted 2025-01-25 (`91ec5e0`) | Treat every secret that was in it as compromised. I did not read it. Rotate (see open question 1). |
| **Token confusion** | `middleware/auth.go:97-134`: family middleware accepts any valid token with a `familyId` claim, including profile tokens | A CHILD profile token can create a PARENT profile, select any PIN-less profile, and rename the family. |
| **Sessions renew forever** | Same cause: a profile token can call `/profiles/select` to mint a new one | The 7-day family expiry is never enforced. |
| Client overwrites the family token | `Profile/queries/selection.ts:20` writes the profile token to the same `token` key | The client depends on the token confusion bug to switch profiles. |
| No revocation | Middleware never touches the DB | Deleted profiles, deleted families and demoted parents keep working tokens. |
| Cannot connect to Supabase | `database/connection.go:29`: host `localhost`, `sslmode=disable` hardcoded; `DatabaseURL` config field never set | |
| `DROP_TABLES=true` in the startup path | `database/init.go:36` | One env var wipes the database. Never port. |
| Migration runner is broken | `init.go:18` enables migration 013, but only 016 is registered; migrations run before schema creation | |
| Meals draft schema cannot be created | `meals_tables.go`: `recipe.id VARCHAR(36)` but `recipe_id INTEGER REFERENCES recipe(id)`; same for family and profile FKs | Use it as a list of nouns only. Ingredients as one JSONB blob also blocks shopping-list aggregation. |
| No PIN or password recovery | Changing a PIN always needs the current PIN; no password change or reset exists | SES has one unused invite email. |
| One-owner rule not in the DB | Owner = "first profile created" (`profile/service.go:64`) | Needs a partial unique index. |
| Soft-delete breaks re-registration | Email is `UNIQUE` but lookups skip deleted rows | Raw constraint error as a 500. |
| Error handling | Validation failures return 500 with `err.Error()`; middleware returns plain text, handlers JSON | |
| No server hardening | No timeouts, body limits or graceful shutdown; S3 client and `.env` reloaded per request; AWS keys required to boot | |

### Not a problem

- JWT signing-method check is present. Passwords use bcrypt. `Pin` and `Password` are excluded from JSON. IDs are UUIDv7.

## 3. Tech choices

### Server

| Area | Choice | Why |
|---|---|---|
| Router | stdlib `net/http` ServeMux | Method and path patterns are enough; no dependency |
| DB driver | pgx v5 + pgxpool | Current standard; native Postgres types |
| Queries | **sqlc** (change) | Compile-checked SQL, no hand-written scanning |
| Migrations | goose, plain SQL, run by `make migrate` | Explicit and versioned; never run at server startup |
| Sessions | **Opaque tokens, hashed in a `session` table** (change) | Revocable; role read live from the DB |
| Transport | **httpOnly, SameSite=Strict cookies** (change) | Not readable by scripts; see hosting note below |
| Password / PIN hash | bcrypt (`x/crypto`) | Already in use. A 6-digit PIN is protected by lockout, not by the hash. |
| Rate limiting | `x/time/rate` per IP on login/register; per-profile PIN lockout stored in the DB | In-memory is enough for one instance; lockout survives restarts |
| Validation | Hand-written `Validate()` per request type | Small surface; no reflection library |
| Logging / config | `log/slog`; env vars parsed once at startup | AWS optional until used |
| IDs | Native `uuid` columns, UUIDv7 generated in Go | Replaces `VARCHAR(36)` |

Hosting note: cookies are simplest when client and API share an origin. Dev uses the Vite proxy. For production I recommend the Go binary serves the built client, which removes CORS entirely. If the client is hosted separately, this needs revisiting (open question 3).

### Auth design tweaks (flow unchanged)

- Two cookies: family session (7d) and profile session (24h). Each middleware accepts only its own kind.
- Switching profile clears the profile session only.
- Creating profiles, changing roles and deleting profiles require a PARENT profile session.
- A PARENT can reset another profile's PIN. The owner resets their own by re-entering the family password.
- PIN lockout: 5 failures, then increasing delay.
- Emails stored lower-cased with a unique index. Passwords 10–72 characters.
- `ALLOW_REGISTRATION` flag so sign-up can be closed after the first family.
- Partial unique index: one owner per family.

### Client

| Area | Choice | Why |
|---|---|---|
| Build | Vite (current) + React 19 + TypeScript strict | As proposed |
| Styling | Tailwind 4 + shadcn/ui regenerated | As proposed |
| Routing / data | TanStack Router (file-based) + Query | Owner knows it; legacy patterns carry over |
| Forms | react-hook-form + zod | Same as legacy |
| API types | **`openapi-typescript` + `openapi-fetch`** (change) | Types come from the contract |
| Structure | **`src/features/*` + `src/components/ui`** (change) | Fewer places to look; no classification debates |
| Lint / format | ESLint flat config (typescript-eslint, TanStack plugins) + Prettier | Drop airbnb; its flat-config support is poor |
| Package manager | Yarn 1.22 | Already installed; no global installs |

### DB, testing, CI

| Area | Choice | Why |
|---|---|---|
| Local DB | `postgres:17` in compose | Match the Supabase project's major version (check when creating it) |
| Server tests | Real Postgres via `pgtestdb` (one cloned DB per test) | Fast, parallel-safe, no Colima socket setup that testcontainers needs |
| Test style | Handler tests through the real router; core function only, a planned list per domain | One test per behaviour; nothing that adds no functional coverage |
| Client tests | Vitest + Testing Library + MSW | MSW handlers typed from the contract |
| E2E | One Playwright smoke test, added after meals slice 1 | Not before there is something to protect |
| CI | GitHub Actions, path-filtered `server` and `client` jobs, one required `ci-ok` job | Only the changed side runs |
| CI checks | gofmt, golangci-lint, `go test -race`, `sqlc diff`, migrations up, govulncheck; tsc, eslint, vitest, build; generated types up to date | |
| Dependencies | Dependabot, grouped, monthly | Low upkeep |

Tooling: `goose` and `sqlc` pinned with `go.mod` tool directives (no install). `golangci-lint` and `lefthook` are missing on this machine and need `brew install` by the owner.

## 4. Repo layout and AI guardrails

```
cadence/
├── CLAUDE.md                 # ≤60 lines: map, commands, hard rules
├── Makefile                  # dev, check, test, migrate, gen
├── docker-compose.yml        # postgres:17 only
├── lefthook.yml
├── env.example               # local-only values
├── api/openapi.yaml          # the client/server contract
├── docs/
│   ├── spec/meals.md         # product spec + data model
│   └── decisions/            # short ADRs
├── .claude/
│   ├── settings.json         # permissions + hooks
│   └── skills/               # add-endpoint, add-migration (loaded on demand)
├── .github/workflows/ci.yml
├── server/
│   ├── CLAUDE.md             # Go conventions, how to add an endpoint, test pattern
│   ├── cmd/api/main.go
│   ├── db/{migrations,queries}/   # goose SQL, sqlc SQL
│   ├── sqlc.yaml
│   └── internal/
│       ├── app/              # config, service wiring, every route
│       ├── identity/{auth,family,profile}/   # each: handler, service, repository, model
│       ├── meals/            # recipes, plan, shopping
│       ├── middleware/       # session, module and HTTP wrappers
│       ├── models/           # shared types: roles, caller, permissions, errors
│       └── platform/{audit,db,httpx,passhash,ratelimit,testutil,validate}/
└── client/
    ├── CLAUDE.md             # React conventions, how to add a screen
    └── src/
        ├── routes/           # TanStack file routes
        ├── features/{auth,profiles,meals}/
        ├── components/ui/    # shadcn
        └── lib/api/          # generated types + fetch client
```

`legacy/` is git-ignored and never edited. Delete the local copy after milestone 4; both repos are on GitHub.

### CLAUDE.md contents

| File | Contains | Loaded |
|---|---|---|
| Root | One-paragraph purpose, directory map, `make` commands, hard rules (below), pointer to `docs/` | Every session |
| `server/`, `client/` | Conventions, a worked "add a feature" checklist, test pattern, generated files not to edit | Only when Claude works in that folder |

Hard rules in root: work on a feature branch; conventional commits; `make check` before every commit; never push to `main`; never edit `legacy/`, merged migrations or generated files; never read `.env`; never touch production.

### Permissions (`.claude/settings.json`)

- Allow: `make *` dev targets, `go build/test/vet`, `yarn lint/test/build`, read-only git, `git add/commit/switch`, `gh pr create/view`.
- Deny: reading `.env`, `.env.local`, `.env.production` and `legacy/**/.env`; editing `legacy/**`; `git push --force`; pushes to `main`; `git reset --hard`; `make migrate-prod`.
- The template is named `env.example` so a broad `.env*` deny does not block it.
- Deny rules are pattern matches, not a security boundary. The real protection is that **production secrets never exist inside the repo folder**. The repo `.env` holds only local Docker values. The Supabase URL lives outside the workspace and the owner runs production migrations.

### Hooks

| Hook | Action |
|---|---|
| PostToolUse (Edit/Write) | `gofmt` + `goimports` on `.go`; Prettier on client files |
| PreToolUse (Edit/Write) | Block `legacy/**`, generated files, and migrations already on `main` |
| lefthook pre-commit | Format and lint staged files only |
| lefthook pre-push | `make check`; refuse pushes to `main` |

### Keeping tokens and upkeep low

- Per-folder CLAUDE.md files load lazily, so server rules cost nothing in a client session.
- The contract is the boundary: client work reads `api/openapi.yaml`, not server code.
- One session per milestone; `/clear` between them.
- `make check` prints only failures. Verbose passing output is wasted context.
- Repeatable procedures live in skills, which cost nothing until invoked.
- Deny reads of `yarn.lock`, `go.sum`, `node_modules`, `dist` and generated files.
- Small feature packages keep file reads narrow.

### When and how to split

- Split if: a second client appears (mobile), a collaborator owns one side, the two sides deploy on different schedules, or CI passes 10 minutes.
- How: `git filter-repo --subdirectory-filter server` (and `client`) keeps history. The only shared file is `api/openapi.yaml`; it moves with the server and the client consumes a published copy.
- Kept cheap by: no imports across `server/` and `client/`, separate CI jobs, separate dependency manifests.

## 5. Build plan

Each milestone is one branch and one PR unless noted. "Parallel" means safe to run in separate worktrees or subagents.

### M0 — Owner prerequisites

| Step | Done when |
|---|---|
| Answer open questions 1–4 | Recorded in `docs/decisions/` |
| `brew install golangci-lint lefthook` | Both on `PATH` |
| Create the empty GitHub repo | Clone URL exists |

### M1 — Skeleton and guardrails

| # | Milestone | Done when | Parallel |
|---|---|---|---|
| 1.1 | `git init`, personal `user.email`, `.gitignore`, root CLAUDE.md, permissions, Makefile stub | `git status` clean; `legacy/` untracked; commit shows the personal email | No (first) |
| 1.2 | Server: `main`, config, slog, `/healthz`, graceful shutdown, `httpx` helpers with tests | `make check` green for server | With 1.4 |
| 1.3 | DB: compose, baseline goose migration, sqlc, `pgtestdb` helper | `make db-up migrate test` passes a DB round-trip test | After 1.2 |
| 1.4 | Client: Vite, React 19, Tailwind 4, Router, Query, shadcn init, Vitest, dev proxy | `yarn build` and one test pass; page shows `/healthz` result | With 1.2 |
| 1.5 | Contract: `api/openapi.yaml` with `/healthz`, type generation both sides | `make gen` produces no diff | After 1.2, 1.4 |
| 1.6 | Gate: full `make check`, lefthook, Claude hooks, CI, branch rules | A PR with a failing test is red; fixed PR is green; direct push to `main` is refused | Last |

### M2 — Meal spec (docs only; parallel with M1 and M3)

| # | Milestone | Done when |
|---|---|---|
| 2.1 | Owner answers the product questions in section 6 | Answers recorded |
| 2.2 | `docs/spec/meals.md`: scope, screens, data model, permissions per role | Owner signs off |

### M3 — Server identity

| # | Milestone | Done when | Parallel |
|---|---|---|---|
| 3.0 | Identity endpoints written into the contract | Owner approves the endpoint list | First |
| 3.1 | Migration: `family`, `profile`, `session` with constraints | Constraint tests pass (one owner, unique email) | After 3.0 |
| 3.2 | Register (one transaction), login, logout, current family | Tests: rollback on failure, duplicate email, bad password, closed registration | After 3.1 |
| 3.3 | List profiles, select profile with hashed PIN and lockout | Tests: wrong PIN, lockout, family session rejected on profile routes and the reverse | After 3.2 |
| 3.4 | Profile create/update/delete with role rules, PIN reset | Planned tests: a CHILD is refused, owner and self protected, PIN reset by role | With 3.5 |
| 3.5 | IP rate limits, body limits, timeouts, security headers | Tests show 429 after the limit | With 3.4 |
| 3.6 | `/security-review` on the whole identity package | Findings fixed or recorded | Last |

### M4 — Client auth (starts after 3.0, against MSW mocks; parallel with M3)

| # | Milestone | Done when |
|---|---|---|
| 4.1 | Typed API client, error handling, session-expiry redirect | Unit tests pass |
| 4.2 | Login and register screens | Component tests pass; works against the real server |
| 4.3 | Profile picker and PIN pad | Lockout message shown; switching profile works |
| 4.4 | Authenticated layout, route guards, profile management | A CHILD cannot see parent-only controls |

### M5 — Deploy the walking skeleton

| # | Milestone | Done when |
|---|---|---|
| 5.1 | Supabase project; Data API disabled; RLS migration; owner runs `migrate-prod` | Tables exist; REST request with the public key returns nothing |
| 5.2 | Host the app per open question 3 | Login and profile select work from a second machine |
| 5.3 | Backup routine (`pg_dump` script the owner runs) | One restore tested locally |

### M6 — Meals, in vertical slices

Each slice: contract first, then server and client in parallel, then one integration pass.

| # | Slice | Done when |
|---|---|---|
| 6.1 | Recipes: create, edit, list, view | A parent adds a recipe with ingredients and finds it again |
| 6.2 | Weekly plan: assign recipes or free text to days | A week can be filled, changed and viewed by a child |
| 6.3 | Shopping list: generate from a week, add manual items, tick off | List merges duplicate ingredients; ticks persist across devices |
| 6.4 | Recipe images (S3) | Upload validated by type and size; image shown |
| 6.5 | Mobile polish and Playwright smoke test | Smoke test runs in CI |

Slices 6.1 → 6.2 → 6.3 are sequential. 6.4 can run alongside 6.2 or 6.3.

### Later

- Password reset by email (SES). PWA/offline. Recipe import from URL.

## 6. Open questions, ranked by how much they block

### Blocking M0–M1

1. **Leaked secrets.** `cadence-api` is public and had `.env` committed for three weeks. Which secrets were in it, and are any still live (AWS keys, JWT secret, DB password)? Rotate anything still in use. The rebuild will use new secrets regardless.
2. **Repo name and visibility.** The legacy client's remote is `chris-abs/cadence`, so the name may be taken. Rename the old one or pick a new name? Also: on a free plan, branch protection on a private repo may need GitHub Pro (check at setup). Public repo, Pro, or rely on the local pre-push hook?
3. **Hosting.** Where will the API and client run in production? My default: one Go binary serving both, on a small host (Fly.io or similar). This decides the cookie and CORS design.
4. **Company laptop.** Global git email is the work address; the repo will set the personal one. Is personal development, Docker, and personal AWS/Supabase credentials on this machine allowed by your employer?

### Blocking M3

5. **Sessions vs JWT.** Accept opaque server-side sessions in cookies (my recommendation), or keep JWT? If JWT: v5, a token-type claim, and a DB role check on every request.
6. **Who registers?** One household only, or open sign-up? My default: closed after the first family.
7. **What is the PIN for?** If it stops children picking a parent profile, parent profiles must be required to have one once a child profile exists. Agree?
8. **Shared tablet or personal phones?** On a personal phone a 24h profile session is annoying. Offer "stay signed in on this device"?

### Blocking M2 and M6 (meal scope)

9. **Ingredients:** structured (quantity, unit, name) or free-text lines? Structured is needed to merge quantities on the shopping list.
10. **Plan shape:** dinners only, or breakfast/lunch/dinner/snack slots? Which day starts the week?
11. **Non-recipe entries:** allow "leftovers", "eating out" or free text in a slot? More than one recipe per slot?
12. **Shopping list:** one list per week or one running list? Merge by name and unit? Manual items? Grouped by aisle?
13. **Shopping on the phone:** must ticks sync live between two people in the shop? Must it work offline?
14. **Children:** view only, or can they suggest meals and tick items?
15. **Servings:** scale recipes by serving count, per plan entry?
16. **Recipe entry:** manual only for v1, or import from a URL? Photos in v1?
17. **Out of scope unless you say otherwise:** pantry tracking, nutrition, cost, AI-generated plans, who-cooks assignments.

Default v1 if you just want to say yes: structured ingredients with optional quantity and unit; dinner-first plan with a slot field so more can be added; free-text entries allowed; one generated list per week that merges same name and unit, plus manual items and tick-off; children view and tick; no import, photos in slice 6.4, no offline.
