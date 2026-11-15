# Cadence web client

React 19 + TypeScript (strict) + Vite + Tailwind 4 + TanStack Router/Query + openapi-fetch.
Talks to the Go API only through `api/openapi.yaml`; never read `server/` code.

Client architecture (component ownership, structure, dependencies) is the owner's decision.
Add nothing beyond this skeleton without their direction.

## Generated, never edit

Run `yarn gen` to regenerate both:

- `src/lib/api/schema.d.ts`: types from `api/openapi.yaml`, used by `src/lib/api/client.ts`.
- `src/routeTree.gen.ts`: from the file routes in `src/routes/` (also refreshed by `yarn dev`/`build`).

## Commands

`yarn dev` (:5173, proxies `/api` to :8080) · `yarn build` · `yarn test` · `yarn lint` ·
`yarn format` · `yarn gen` · `yarn run check` (the gate; plain `yarn check` is a Yarn built-in).
Lint is oxlint (type-aware, `.oxlintrc.json`); format is oxfmt (`.oxfmtrc.json`).
