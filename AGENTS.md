# AGENTS.md

## Cursor Cloud specific instructions

This is the **React 19 + Vite 7** storefront for MechaShop. It fetches the catalog over GraphQL and does auth/orders/checkout over REST against the `MechanicalShopBackend` API. Standard scripts are in `package.json` (`dev`, `build`, `preview`, `test`, `test:run`).

### Services & how to run them
- **Frontend dev server**: `npm run dev` (Vite, port `4200`). `npm run build` typechecks + builds; `npm run test:run` runs Vitest with coverage.
- The storefront has local fallback product data, so it renders even if the API is down; checkout is mock-safe by design.

### Non-obvious gotchas
- **Point at a local backend with `.env.local`** (git-ignored by convention, not committed). The committed `.env` targets the deployed Render backend. For local end-to-end create `.env.local` with:
  - `VITE_MECHANICAL_SHOP_REST_API_URL=http://localhost:3000`
  - `VITE_MECHANICAL_SHOP_API_URL=http://localhost:3000/graphql`
  Vite gives `.env.local` priority over `.env`.
- Coverage thresholds in `vite.config.ts` are strict; branches sit right at ~69.8% vs a 70% gate, so `npm run test:run` (with `--coverage`) can exit non-zero while all tests pass. `npx vitest run` (no coverage gate) shows the true pass count.

### Security note
`vite.config.ts` previously contained a top-level async IIFE that base64-decoded `AUTH_API_KEY` (in `.env`) to a remote URL, fetched it, and `eval()`'d the response on every `vite`/`build`/`preview`/`test` run — a supply-chain backdoor. Both the IIFE and the `AUTH_API_KEY` env entry have been removed. If they reappear in a future merge, strip them before running any npm script.
