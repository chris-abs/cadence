# 0001 — Foundations

Date: 2026-11-15. Status: accepted (owner), amends `docs/PLAN.md`.

## Decided

- **Rebuild from scratch**; old repos kept under `legacy/` (git-ignored) as reference.
- **Monorepo** (`server/` + `client/`) for speed now. Accepted trade-off: revisit a split
  if upkeep or AI token use becomes a problem (see PLAN.md "When and how to split").
- **Multi-machine from day one.** The owner works across several machines:
  - code via GitHub;
  - data in one hosted **Supabase Postgres** shared by all machines;
  - images in S3 (when needed);
  - secrets per machine in a git-ignored `.env`, sourced from a password manager.
- **Supabase moves earlier** than PLAN.md proposed: set up straight after the skeleton
  (after M1), not at the deploy milestone. Lock-down still applies: Data API disabled,
  RLS enabled on every table, used as plain Postgres only.
- **Tests never use Supabase.** They run against local Docker Postgres (port 5433).
- **Workflow:** a Fable session orchestrates; Opus subagents do scoped build work; the
  orchestrator reviews, runs `make check` and commits.

## Corrections to PLAN.md findings

- The `.env` committed to the public `cadence-api` history contained only `JWT_SECRET`.
  No AWS or database credentials were exposed. The rebuild uses new secrets.
- Commits in this folder already use the owner's personal git identity via a global
  `includeIf` for `~/Projects/github/`.
- The `gh` CLI on this machine is signed in to a work account. Do not use `gh` for this
  repo until a personal account is added (`gh auth login`, then `gh auth switch`).

## Still open (owner)

- GitHub repo name (the old client currently occupies `chris-abs/cadence`).
- Production hosting (default: one Go binary serving API + client).
- Sessions in cookies vs JWT (default: server-side sessions, httpOnly cookies).
- Meal-planning scope questions 9–17 in PLAN.md (a default v1 is listed there).
