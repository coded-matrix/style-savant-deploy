# Style Savant — CLAUDE.md

## What This Project Is

Style Savant is a Next.js 15 web application that provides three AI-powered services for fashion vendors in Ghana. It was formerly called "Coded Application Services" and was rebranded. The target users are fashion vendors who need body measurement tools for customers and AI-driven inventory management for their businesses.

## Three Core Features

### 1. Smart Measurement System — FREE
- **Route:** `/measurement`
- Camera-based body scanning using MediaPipe Pose (client-side, no server round-trip)
- Detects 33 body landmarks and calculates chest, waist, hips, inseam, and sleeve measurements
- Recommends clothing sizes (S/M/L/XL)
- Saves measurements to the database via `POST /api/measurements`
- Key files: `components/measurement/MeasurementScanner.tsx`, `lib/measurement/calculator.ts`

### 2. AI Inventory Optimization — Token-gated
- **Route:** `/inventory`
- **Costs:** 10 tokens/analysis, 5 tokens/background removal, 15 tokens/demand forecast
- Demand forecasting (week/month/quarter periods) with 4 urgency-level restock alerts (critical/high/medium/low)
- Overstock detection with capital tie-up warnings
- AI background removal for product photos via Google Gemini 2.0 Flash
- Seasonal trend analysis
- Key files: `lib/inventory/gemini-service.ts`, `lib/inventory/demand-forecaster.ts`, `lib/inventory/inventory-analyzer.ts`
- API routes under `app/api/inventory/`

### 3. Token Subscription System — Revenue engine
- **Route:** `/tokens`
- Prepaid credits for accessing AI features (Act 987 compliant — Ghana's Electronic Transactions Act)
- Pricing: GHS 75 per 1,000 tokens with volume discounts at 5K (5% bonus) and 10K (7.5% bonus)
- Payment via Paystack; webhook at `POST /api/webhooks/paystack` verifies charge and credits tokens
- Low-balance alerts trigger at < 100 tokens
- Key files: `lib/tokens/token-manager.ts`, `lib/tokens/paystack-service.ts`
- API routes under `app/api/tokens/`

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Radix UI |
| ORM | Drizzle ORM |
| Database | PostgreSQL (production) or SQLite via `better-sqlite3` (dev) |
| AI — body detection | MediaPipe Pose (client-side JS) |
| AI — image/inventory | Google Gemini 2.0 Flash (server-side) |
| Payments | Paystack |
| Charts | Recharts |
| Auth | NextAuth v5 (beta) + bcryptjs + jsonwebtoken |
| Validation | Zod + @t3-oss/env-nextjs |

## Project Layout

```
app/
  page.tsx                  # Homepage with 3 feature cards
  measurement/page.tsx      # Body scanning UI
  inventory/page.tsx        # Inventory dashboard (tabs: Dashboard, Forecast, BG Removal)
  tokens/page.tsx           # Token management (tabs: Balance, Purchase, History)
  tokens/callback/page.tsx  # Paystack payment return handler
  api/measurements/         # Save measurements
  api/inventory/            # alerts, analyze, forecast, remove-background, usage-stats
  api/tokens/               # balance, purchase, verify, transactions
  api/webhooks/paystack/    # Webhook receiver

components/
  measurement/MeasurementScanner.tsx
  inventory/InventoryAlerts.tsx, DemandForecast.tsx
  tokens/TokenBalance.tsx, TokenPurchase.tsx
  ui/                       # shadcn/ui components (button, card, badge, …)

lib/
  db/index.ts               # DB connection — switches between PG and SQLite
  db/schema.ts              # All table definitions (Drizzle)
  measurement/              # calculator.ts, types.ts
  inventory/                # demand-forecaster.ts, gemini-service.ts, inventory-analyzer.ts, types.ts
  tokens/                   # token-manager.ts, paystack-service.ts, types.ts
  utils.ts

scripts/setup-db.ts         # One-time database setup
mds/                        # Reference documentation (architecture, deployment, etc.)
```

## Database Schema

Core tables: `users`, `vendors`, `products`, `orders`, `order_items`, `body_measurements`

Feature-specific tables:
- `subscriptions` — per-vendor token balance
- `token_transactions` — purchases, usage, refunds
- `ai_usage_logs` — Gemini API call records
- `inventory_analyses` — forecast results
- `sales_history` — used by forecasting algorithms

## Environment Variables

```env
# Database (one of these two modes)
USE_SQLITE=true                          # local dev
DATABASE_URL="postgresql://..."          # production

# External services
GOOGLE_GEMINI_API_KEY=...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=...
NEXTAUTH_SECRET=...
```

## Common Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run db:push      # Apply schema to database (no migration files)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:generate  # Generate migration files
```

## Local Development Notes

- Set `USE_SQLITE=true` to use a local `dev.db` file — no PostgreSQL needed
- Demo vendor ID for testing: `demo-vendor-123`
- Smart Measurement works without any API keys (MediaPipe is client-side)
- AI Inventory features require `GOOGLE_GEMINI_API_KEY`
- Token purchases require Paystack test keys

## Security Model

- API keys are server-side only (never exposed to the client)
- Paystack webhook signature verified on every callback
- Token gating enforced on all AI API routes before calling Gemini
- SQL injection prevented via Drizzle ORM parameterized queries
- Camera access requires HTTPS in production (localhost exempted)

## Deployment

Recommended platform: **Vercel** with PostgreSQL (Vercel Postgres or Supabase/Neon).

- Paystack webhook must be registered at `https://<domain>/api/webhooks/paystack` with event `charge.success`
- All env vars listed above must be set in the Vercel dashboard

## Design System

- Primary: purple `#9333EA`
- Accent: pink `#EC4899`
- Info: blue `#3B82F6`
- Success/free: green `#10B981`
- Warning: amber `#F59E0B`
- Error/critical: red `#EF4444`
