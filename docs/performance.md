# Performance

Unnecessary work is a defect. These are the server budgets the orchestrator checks in
review. They are measured during review and reported in the pull request; they are not
enforced by committed benchmark or query-count tests.

Client performance is the owner's to define once the client is built.

## Server budgets

| Budget | Target |
|---|---|
| Queries per request | A fixed number per endpoint, no N+1. An authenticated request spends one query on the session lookup. |
| Query count after a refactor | No higher than before on any endpoint, unless the pull request says why. |
| Password and PIN hashing | Slow by design (bcrypt). Only on login, re-authentication and PIN entry, never on ordinary requests. |
| Writes on read paths | Session renewal writes at most once a minute per session. |
| List endpoints | Paginated or hard-capped; filters and sorts backed by an index. |
| Background work | No unbounded goroutines; periodic jobs are cancellable and cheap. |

## How they are used

- The orchestrator measures during review (a throwaway tracer or `EXPLAIN` is enough)
  and puts the numbers in the pull request when they are relevant.
- Do not optimise without a measurement, and do not add caching or memoisation that the
  measurement does not justify: needless complexity is also a defect.
- A budget changes here, with the reason, never silently.
