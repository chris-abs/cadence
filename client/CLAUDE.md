# Cadence web client

React 19 + TypeScript (strict) + Vite + Tailwind 4 + shadcn/ui + TanStack Router/Query.
Talks to the Go API only through `api/openapi.yaml`; never read `server/` code.

## Layout

| Path                      | What                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| `src/routes/`             | TanStack file routes. Thin: wire a feature into a URL.                           |
| `src/features/<feature>/` | Query hooks, components and tests for one feature. `index.ts` is its public API. |
| `src/components/ui/`      | shadcn components. Add with `yarn shadcn add <name>`.                            |
| `src/components/`         | Shared app components (e.g. `not-found.tsx`).                                    |
| `src/lib/api/`            | `api` client, `unwrap`, `ApiError`, generated `schema.d.ts`.                     |
| `src/lib/query-client.ts` | The one `QueryClient` factory and its defaults.                                  |
| `src/test/`               | Vitest setup, MSW server, typed handlers, `renderWithQuery`.                     |

## Generated files (never edit; run `yarn gen`)

- `src/lib/api/schema.d.ts` from `../api/openapi.yaml` (openapi-typescript)
- `src/routeTree.gen.ts` from `src/routes/` (TanStack Router; also refreshed by `yarn dev`/`build`)

## Commands

`yarn dev` (:5173, proxies `/api` to :8080) · `yarn test` · `yarn lint` · `yarn format` ·
`yarn gen` · `yarn run check` (the gate; plain `yarn check` is a Yarn built-in).
Lint is oxlint (type-aware, `.oxlintrc.json`); format is oxfmt (`.oxfmtrc.json`, sorts
imports and Tailwind classes). Fix a rule's cause; disable a rule only in config, with a reason.

## Conventions

- Server state lives in TanStack Query only. No copying query data into `useState`.
- Call the API as `unwrap(api.GET("/path", { signal }))`: it returns typed data or throws `ApiError`.
- Define queries with `queryOptions` next to their hook, keys start with the feature name.
- Base URL is the relative `/api`; never hardcode hosts. Sessions are httpOnly cookies.
- Import with `@/`. Use type guards, not `as`. No `any`.
- Small components, one job each. Accessible by default: real headings, labels,
  `role="status"` for live state, decorative icons `aria-hidden`.
- Add a dependency only when a feature uses it, with a one-line reason in the PR.

## Add a screen or feature

1. Contract: change `api/openapi.yaml` first (agreed with the server side).
2. `yarn gen`, then commit the regenerated `schema.d.ts`.
3. `src/features/<name>/`: query/mutation hooks, components, `index.ts` exports.
4. Route: add `src/routes/<path>.tsx` with `createFileRoute`; keep it thin. Run `yarn gen`.
5. MSW: add typed handlers for new endpoints in `src/test/handlers.ts`.
6. Tests next to the code (`*.test.tsx`), covering success and error states.
7. `yarn run check` passes, then commit.

## Test pattern

- Render through `renderWithQuery(<Component />)` (fresh `QueryClient`, no retries).
- Network is mocked by MSW; unhandled requests fail the test. Default handlers are
  happy paths; override per test with `server.use(health.networkError())`.
- Type handler bodies from the schema: `http.get<PathParams, never, Schemas["Health"]>`.
- Query by role and visible text (`findByRole`, `findByText`); click with `userEvent`.
