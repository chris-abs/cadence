# Performance budgets

Unnecessary work is a defect. These budgets define "acceptable"; work that misses one is
not done. Each budget has a way to measure it, and the measurement is part of the tests
or of `make check` wherever that is practical.

Status: initial budgets set by the orchestrator on 2026-11-15. The numbers are starting
points to be tightened or loosened with evidence, by a decision record, never silently.

## Server (Go API)

| Budget | Target | How it is measured |
|---|---|---|
| Queries per request | A fixed, documented number per endpoint; no N+1. An authenticated request spends at most 1 query on session + profile + role, and at most 1 more on module state. | Query-count assertion in handler tests (a counting tracer on the pool) |
| Session middleware overhead | ≤ 1 ms p95 against local Postgres | `go test -bench` benchmark, committed |
| Permission check (`authz.Can`) | No allocation, ≤ 200 ns | Benchmark with `-benchmem` |
| Request latency, non-password endpoints | ≤ 50 ms p95 locally, with realistic data volume | Benchmark or load script per feature slice |
| Password and PIN hashing | Slow by design (bcrypt). Only on login, re-authentication and PIN entry, never on ordinary requests. | Code review + test asserting no hash call on session-authenticated routes |
| Writes on read paths | Session renewal writes at most once a minute per session | Test |
| List endpoints | Bounded: paginated or hard-capped; every filter and sort backed by an index | `EXPLAIN` in review for new queries; test with a seeded large dataset |
| Background work | No unbounded goroutines; periodic jobs are cancellable and cheap | Review + shutdown test |

## Client (React)

| Budget | Target | How it is measured |
|---|---|---|
| Re-renders | An interaction re-renders only the components whose output changes. Timers, countdowns and input state live in the smallest leaf component. Typing in one field does not re-render the form's siblings or the page shell. | Render-count tests (React `Profiler`) on key interactions |
| Global listeners | Activity tracking (auto-lock) and similar listeners never cause React renders by themselves | Render-count test |
| Server state | Lives in TanStack Query only: no copies in component state, no refetch on every mount, sensible `staleTime`, no request waterfalls | Network-call assertions in tests (MSW) |
| Derived data | Computed during render or memoised when genuinely costly; never stored and synced with effects | Lint + review |
| Initial JavaScript | ≤ 200 kB gzipped for the entry route; feature routes are code-split | Bundle-size check in `yarn run check` |
| Route change | No full-page spinner for data already cached | Test |
| Lists | Long lists (over ~100 rows) are virtualised or paginated | Review + test |

## How budgets are used

- Every brief names the budgets that apply and the evidence required.
- The orchestrator checks the evidence in review and measures anything that looks costly.
- A missed budget is fixed, or changed here through a decision record that says why.
- Do not optimise without a measurement, and do not add caching or memoisation that the
  measurement does not justify: needless complexity is also a defect.
