# `oldlib/` — retired frontend "dummy backend"

This directory contains code that was retired when the frontend was rewired to
the standalone Express backend at
[`coded-matrix/application-service-backend`](https://github.com/coded-matrix/application-service-backend).

It is kept here for reference and to make the SQLite-only local-dev fallback
recoverable. **Nothing under `oldlib/` is imported by the current app.** The
Next.js TypeScript config excludes this directory so it cannot accidentally
re-enter the build.

## What lived here, and where it went

| Retired path | Replacement in `application-service-backend` |
| --- | --- |
| `oldlib/app/api/inventory/analyze/route.ts` | _(deferred)_ vendor analytics endpoints planned |
| `oldlib/app/api/inventory/alerts/route.ts` | _(deferred)_ |
| `oldlib/app/api/inventory/forecast/route.ts` | _(deferred)_ |
| `oldlib/app/api/inventory/remove-background/route.ts` | `POST /api/inventory` with `clean=true` (calls Agnes AI) |
| `oldlib/app/api/inventory/usage-stats/route.ts` | _(deferred)_ |
| `oldlib/app/api/measurements/route.ts` | _(no backend equivalent yet)_ |
| `oldlib/app/api/tokens/balance/route.ts` | _(deferred)_ token-balance endpoints planned |
| `oldlib/app/api/tokens/purchase/route.ts` | _(deferred)_ Paystack endpoints planned |
| `oldlib/app/api/tokens/transactions/route.ts` | _(deferred)_ |
| `oldlib/app/api/tokens/verify/route.ts` | _(deferred)_ |
| `oldlib/app/api/webhooks/paystack/route.ts` | _(deferred)_ |
| `oldlib/lib/db/schema.ts` | `src/db/schema.ts` (identical, byte-for-byte equivalent) |
| `oldlib/lib/db/index.ts` | `src/config/db.ts` (Postgres only, no SQLite fallback) |
| `oldlib/lib/db/sqlite-init.ts` | _n/a_ — SQLite fallback removed |
| `oldlib/lib/db/utils.ts` | inline `new Date()` calls in `src/modules/tokens/token-manager.ts` |
| `oldlib/lib/inventory/demand-forecaster.ts` | _(deferred)_ logic to be ported into `src/modules/inventory/` |
| `oldlib/lib/inventory/inventory-analyzer.ts` | _(deferred)_ |
| `oldlib/lib/inventory/gemini-service.ts` | `src/utils/gemini.ts` + `src/utils/agnes.ts` |
| `oldlib/lib/inventory/types.ts` | _n/a_ — types live next to the code that uses them in the backend |
| `oldlib/lib/tokens/token-manager.ts` | `src/modules/tokens/token-manager.ts` (improved: row-locked transactions, refund support) |
| `oldlib/lib/tokens/paystack-service.ts` | _(deferred)_ server-side Paystack integration planned |
| `oldlib/lib/tokens/types.ts` | `src/modules/tokens/token.types.ts` |
| `oldlib/scripts/setup-db.ts` | `npm run db:migrate` against `application-service-backend/drizzle/` |
| `oldlib/scripts/test-gemini.ts` | use the backend's `/api/campaign/text` instead |

## Reviving the SQLite-only dev mode (off the merged path)

If you ever want to run this repo without the Express backend, the prototype
flow was:

1. Move the contents of `oldlib/app/api/`, `oldlib/lib/db/`,
   `oldlib/lib/inventory/`, `oldlib/lib/tokens/`, and `oldlib/scripts/` back
   to their pre-merge paths.
2. Restore the dependencies listed in `package.json` before they were trimmed
   (`@google/generative-ai`, `better-sqlite3`, `drizzle-orm`, etc.).
3. Set `USE_SQLITE=true` in `.env` and run `npm run dev`. `dev.db` is created
   automatically and seeded with the demo vendor.

This is **not recommended** — it splits the source of truth for the schema
across two repositories. Use the merged setup instead.

## Why not delete it?

The user explicitly asked to keep these files rather than drop them, so the
legacy SQLite dev experience can be recovered if needed and so the migration
history of the schema remains auditable.