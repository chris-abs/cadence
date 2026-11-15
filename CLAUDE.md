# Cadence

A family orchestration platform: one place that runs a family's day-to-day life.
It is signed in on a central family tablet; each person switches to their profile
(PIN-protected) and sees and does what their role allows. The core is identity:
family, profiles, roles and per-module authorisation. Features are modules built on
that core: meal planning first, later calendar, to-dos, activities, music.
This is a from-scratch rebuild; `legacy/` holds the old code as reference only.

## Map

| Path | What |
|---|---|
| `server/` | Go API (stdlib `net/http`, pgx, sqlc, goose). Has its own `CLAUDE.md`. |
| `client/` | React 19 + TypeScript + Vite + Tailwind 4 + TanStack Router/Query. Has its own `CLAUDE.md`. |
| `api/openapi.yaml` | The client/server contract. Types on both sides are generated from it. |
| `docs/PLAN.md` | Reviewed build plan and milestones. |
| `docs/decisions/` | Short decision records. Add one when a choice in the plan changes. |
| `docs/spec/` | Product specs. |
| `legacy/` | Old repos. Git-ignored. Read for reference, never edit. |

## Commands

| Command | Does |
|---|---|
| `make db-up` / `make db-down` | Start / stop local Postgres (Docker, port 5433) |
| `make migrate` | Apply migrations to `DATABASE_URL` |
| `make gen` | Regenerate sqlc code and API types |
| `make dev-server` / `make dev-client` | Run the API (:8080) / the web client (:5173) |
| `make check` | **The quality gate**: format, lint, tests, type-check, build |

## Hooks

- Run `lefthook install` once per clone. pre-commit checks staged files (gofmt,
  golangci-lint, oxfmt, oxlint) without rewriting them; pre-push runs `make check`
  and refuses pushes to `main`.
- `.claude/hooks/` formats each file after an edit and blocks edits to `legacy/`,
  generated files and migrations already on `main`. Fix the cause; never bypass a hook.

## Environments

- **Tests** always use local Docker Postgres. They create and drop databases freely.
- **Shared data** lives in a hosted Supabase Postgres so it follows the owner across
  machines. Its connection string is kept outside the repo; only the owner runs
  migrations against it.
- `.env` holds local-only values (copy from `env.example`).

## Hard rules

1. Work on a feature branch; never commit to or push `main` directly once the remote exists.
2. `make check` must pass before every commit. Never skip hooks (`--no-verify`).
3. Commit small and often: every time a step works and `make check` passes.
   Messages follow the owner's style: one lowercase line, `feat:` / `fix:` / `chore:`,
   no scope, no body. Examples: `feat: profile pin lockout`, `fix: session expiry check`,
   `chore: cleanup`. Branches are `feature/<name>`.
4. Never read, print or commit `.env` files or any secret.
5. Never edit `legacy/`, generated files, or a migration that has already been merged.
   Schema changes are always a new migration.
6. Change `api/openapi.yaml` first, regenerate, then implement both sides.
7. Every behaviour change comes with a test. Auth rules are tested as a role × action matrix.
8. Never run anything against the hosted (Supabase) database or production.
9. No new dependency without a one-line reason in the PR description.

## Style

Clear over clever. Small packages and files with one job. Errors are handled, not
ignored. Comments explain why, not what. Prefer the standard library.
