# Cadence web client

React 19 + TypeScript (strict) + Vite + Tailwind 4 + shadcn/ui + TanStack Router/Query.
Talks to the Go API only through `api/openapi.yaml`; never read `server/` code.

## Layout

| Path                      | What                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- |
| `src/routes/`             | TanStack file routes. Thin: wire a feature into a URL inside a `Page`.          |
| `src/features/<feature>/` | Domain UI, query hooks and tests for one feature. `index.ts` is its public API. |
| `src/components/`         | Shared building blocks: `AppShell`, `Page`, `SectionCard`, `StatusLine`, …      |
| `src/components/ui/`      | shadcn primitives. Add with `yarn shadcn add <name>`.                           |
| `src/index.css`           | Theme tokens (colours, radii, fonts) for light and dark.                        |
| `src/lib/api/`            | `api` client, `unwrap`, `ApiError`, generated `schema.d.ts`.                    |
| `src/test/`               | Vitest setup, MSW server, typed handlers, `renderWithQuery`.                    |

Generated, never edit (run `yarn gen`): `src/lib/api/schema.d.ts` (from the contract) and
`src/routeTree.gen.ts` (from `src/routes/`; also refreshed by `yarn dev`/`build`).

## Commands

`yarn dev` (:5173, proxies `/api` to :8080) · `yarn test` · `yarn lint` · `yarn format` ·
`yarn gen` · `yarn run check` (the gate; plain `yarn check` is a Yarn built-in).
Lint is oxlint (type-aware, `.oxlintrc.json`); format is oxfmt (`.oxfmtrc.json`, sorts
imports and Tailwind classes). Fix a rule's cause; disable a rule only in config, with a reason.

## Components: one shared layer, no bespoke tweaks

Dependencies point one way: `ui` ← `components` ← `features` ← `routes`.

- **Variants, not overrides.** A visual difference is a named variant (cva) or prop on the
  shared component. Features and routes never pass `className`/`style` to a component.*
- **Tokens, not values.** Colours, spacing, radii come from theme tokens (`text-success`,
  `bg-muted`). No arbitrary values like `h-[475px]` in features or routes.* New design value:
  add a token to `src/index.css` (light and dark).
- **Extend, don't fork.** Need something slightly different? Add a variant to the shared
  component. Never copy it (`Badge` + `MigratedBadge`) or add a feature-specific prop
  (`tag`, `isStorageView`); props describe looks or behaviour, not who calls it.
- **Features are islands.** A feature never imports another feature; the shared layer never
  imports a feature; routes import a feature only via its `index.ts`.*
- **`ui/` is shadcn's.** Change it only to add a named variant or use a token. Its class
  recipes (`buttonVariants`) are internal to it.* Shared components take no `className`.
- **Shared means cross-feature.** Promote a component to `src/components/` when a second
  feature needs it (or it is app chrome), with a test. Until then it stays in its feature.

\* Enforced by `yarn lint` (layer overrides in `.oxlintrc.json`) or `scripts/check.sh`.

### Before you add or change a component

1. Does a shared component already do this? Use it, via its props.
2. Only looks differ? Add a variant there (with a test), not a `className` at the call site.
3. New component: one feature only → `src/features/<name>/`; cross-feature → `src/components/`.
4. Needs a new colour or size? Add a token, don't hardcode it.
5. Accessible: real headings, labels, `role="status"` for live state, icons `aria-hidden`.

## Conventions

- Server state lives in TanStack Query only. No copying query data into `useState`.
- Call the API as `unwrap(api.GET("/path", { signal }))`: it returns typed data or throws `ApiError`.
- Define queries with `queryOptions` next to their hook, keys start with the feature name.
- Base URL is the relative `/api`; never hardcode hosts. Sessions are httpOnly cookies.
- Import with `@/` (relative only within a feature). Use type guards, not `as`. No `any`.
- Add a dependency only when a feature uses it, with a one-line reason in the PR.

## Add a screen or feature

1. Contract: change `api/openapi.yaml` first, `yarn gen`, commit the regenerated `schema.d.ts`.
2. `src/features/<name>/`: hooks and components built from `src/components/`; `index.ts` exports.
3. Route: `src/routes/<path>.tsx` with `createFileRoute`, rendering a `Page`. Run `yarn gen`.
4. MSW: typed handlers for new endpoints in `src/test/handlers.ts`.
5. Tests next to the code (`*.test.tsx`), covering success and error states.
6. `yarn run check` passes, then commit.

## Test pattern

- Render through `renderWithQuery(<Component />)` (fresh `QueryClient`, no retries).
- Network is mocked by MSW; unhandled requests fail the test. Default handlers are
  happy paths; override per test with `server.use(health.networkError())`.
- Type handler bodies from the schema: `http.get<PathParams, never, Schemas["Health"]>`.
- Query by role and visible text (`findByRole`, `findByText`); click with `userEvent`.
