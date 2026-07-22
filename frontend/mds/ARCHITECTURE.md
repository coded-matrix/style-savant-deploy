# ⚠️ Pre-merge reference

This document describes the **pre-merge** Style Savant (Next.js app with an
in-repo dummy backend). After the merge with
[`application-service-backend`](../application-service-backend):

- The dummy backend code referenced here now lives under `../oldlib/`.
- The active app is a pure frontend that calls the Express backend via
  `/api/backend/*` (Next.js rewrite).
- For the current architecture, see [`../README.md`](../README.md) and
  [`../oldlib/README.md`](../oldlib/README.md).

Kept here for historical reference only.

---

# System Architecture (legacy)

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CODED APPLICATION SERVICES                   │
│                         (Next.js 15)                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│   FEATURE 1   │        │   FEATURE 2   │        │   FEATURE 3   │
│     Smart     │        │      AI       │        │     Token     │
│  Measurement  │        │   Inventory   │        │ Subscription  │
│               │        │ Optimization  │        │    System     │
│     FREE      │        │  10 tokens    │        │  GHS 75/1K    │
└───────────────┘        └───────────────┘        └───────────────┘
        │                         │                         │
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│   MediaPipe   │        │ Google Gemini │        │   Paystack    │
│  Pose Vision  │        │   2.0 Flash   │        │   Payments    │
│  (Client JS)  │        │  (Server AI)  │        │  (Server API) │
└───────────────┘        └───────────────┘        └───────────────┘
                                  │                         │
                                  └────────┬────────────────┘
                                           │
                                           ▼
                                  ┌───────────────┐
                                  │   Database    │
                                  │  PostgreSQL   │
                                  │      or       │
                                  │    SQLite     │
                                  └───────────────┘
```

## 📁 Folder Structure

```
coded-app-services/
│
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage (3 features)
│   │
│   ├── measurement/              # FEATURE 1: Smart Measurement
│   │   └── page.tsx              # Measurement UI
│   │
│   ├── inventory/                # FEATURE 2: AI Inventory
│   │   └── page.tsx              # Inventory dashboard
│   │
│   ├── tokens/                   # FEATURE 3: Token System
│   │   ├── page.tsx              # Token management
│   │   └── callback/
│   │       └── page.tsx          # Payment callback
│   │
│   ├── api/                      # API Routes
│   │   ├── measurements/
│   │   │   └── route.ts          # Store measurements
│   │   │
│   │   ├── inventory/
│   │   │   ├── alerts/route.ts   # Restock/overstock alerts
│   │   │   ├── analyze/route.ts  # Full analysis
│   │   │   ├── forecast/route.ts # Demand forecast
│   │   │   ├── remove-background/route.ts
│   │   │   └── usage-stats/route.ts
│   │   │
│   │   ├── tokens/
│   │   │   ├── balance/route.ts  # Get balance
│   │   │   ├── purchase/route.ts # Initialize purchase
│   │   │   ├── verify/route.ts   # Verify payment
│   │   │   └── transactions/route.ts
│   │   │
│   │   └── webhooks/
│   │       └── paystack/route.ts # Payment webhooks
│   │
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
│
├── components/                   # React Components
│   ├── measurement/
│   │   └── MeasurementScanner.tsx
│   │
│   ├── inventory/
│   │   ├── InventoryAlerts.tsx
│   │   └── DemandForecast.tsx
│   │
│   ├── tokens/
│   │   ├── TokenBalance.tsx
│   │   └── TokenPurchase.tsx
│   │
│   └── ui/                       # Shared UI (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── ...
│
├── lib/                          # Business Logic
│   ├── measurement/
│   │   ├── calculator.ts         # Measurement algorithms
│   │   └── types.ts
│   │
│   ├── inventory/
│   │   ├── demand-forecaster.ts  # Forecasting logic
│   │   ├── gemini-service.ts     # Google AI client
│   │   ├── inventory-analyzer.ts # Main orchestrator
│   │   └── types.ts
│   │
│   ├── tokens/
│   │   ├── token-manager.ts      # Token operations
│   │   ├── paystack-service.ts   # Payment processing
│   │   └── types.ts
│   │
│   ├── db/
│   │   ├── index.ts              # DB connection
│   │   └── schema.ts             # Database schema
│   │
│   └── utils.ts                  # Utility functions
│
├── scripts/
│   └── setup-db.ts               # Database setup script
│
├── public/                       # Static assets
│
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── drizzle.config.ts             # Database config
│
└── Documentation/
    ├── README.md                 # Main documentation
    ├── QUICK_START.md            # Quick start guide
    ├── DEPLOYMENT.md             # Deployment guide
    ├── PROJECT_SUMMARY.md        # Complete summary
    ├── TESTING_CHECKLIST.md      # Test checklist
    └── ARCHITECTURE.md           # This file
```

## 🔄 Data Flow

### Feature 1: Smart Measurement
```
User Camera → MediaPipe (Client) → Calculate Measurements → Display Results
                                            ↓
                                    Save to Database
```

### Feature 2: AI Inventory
```
Vendor Request → Check Tokens → Run Analysis → Google Gemini AI
                      ↓                               ↓
                Use Tokens                    Generate Insights
                      ↓                               ↓
                 Log Usage  ←─────────────────  Return Results
                      ↓
            Update Token Balance
```

### Feature 3: Token System
```
Vendor → Select Bundle → Paystack Checkout → Payment → Verify → Add Tokens
                                                  ↓
                                          Webhook Callback
                                                  ↓
                                          Update Database
                                                  ↓
                                          Return to Dashboard
```

## 🗄️ Database Schema

```sql
-- Core Tables
users (id, email, password, name, role)
vendors (id, userId, businessName, verified)
products (id, vendorId, name, price, stock)

-- Measurement Feature
body_measurements (id, userId, chest, waist, hips, ...)

-- Token System
subscriptions (id, vendorId, tokensTotal, tokensUsed, status)
token_transactions (id, vendorId, type, amount, balance)

-- AI Inventory
ai_usage_logs (id, vendorId, featureType, tokensCost)
inventory_analyses (id, vendorId, productId, forecasts, recommendations)
sales_history (id, vendorId, productId, quantitySold, revenue)

-- Orders
orders (id, userId, vendorId, totalAmount, status)
order_items (id, orderId, productId, quantity, price)
```

## 🔌 API Architecture

### REST API Endpoints

```
/api/measurements
├── POST /     Create measurement

/api/inventory
├── GET  /alerts              Get alerts
├── POST /analyze             Run full analysis
├── GET  /forecast            Demand forecast
├── POST /remove-background   AI image processing
└── GET  /usage-stats         Usage statistics

/api/tokens
├── GET  /balance            Get balance
├── POST /purchase           Initialize purchase
├── GET  /verify             Verify payment
└── GET  /transactions       Transaction history

/api/webhooks
└── POST /paystack           Payment webhooks
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│         Client (Browser)                │
│  - No API keys                          │
│  - HTTPS only                           │
│  - React XSS protection                 │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      Next.js Server (API Routes)        │
│  - API key validation                   │
│  - Token gating                         │
│  - Input validation                     │
│  - Rate limiting (planned)              │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      External Services                  │
│  - Google Gemini (API key)              │
│  - Paystack (API key + webhook secret)  │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│          Database                       │
│  - PostgreSQL encryption at rest        │
│  - Parameterized queries (Drizzle ORM)  │
│  - Connection pooling                   │
└─────────────────────────────────────────┘
```

## 🚦 Token Flow

```
┌──────────────┐
│   Purchase   │
│   1,000      │
│   Tokens     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Paystack   │
│   Payment    │
│   GHS 75     │
└──────┬───────┘
       │
       ▼
┌──────────────┐         ┌──────────────┐
│   Webhook    │────────▶│   Verify     │
│   Callback   │         │   Payment    │
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ Add 1,000    │
                         │ Tokens to    │
                         │ Vendor       │
                         └──────┬───────┘
                                │
       ┌────────────────────────┴────────────────────────┐
       │                                                  │
       ▼                                                  ▼
┌──────────────┐                                   ┌──────────────┐
│ Use 10       │                                   │ Use 5        │
│ Tokens for   │                                   │ Tokens for   │
│ Inventory    │                                   │ Background   │
│ Analysis     │                                   │ Removal      │
└──────┬───────┘                                   └──────┬───────┘
       │                                                  │
       └────────────────────────┬────────────────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ Remaining:   │
                         │ 985 Tokens   │
                         └──────────────┘
```

## 🎯 Feature Dependencies

```
Smart Measurement (Free)
├── MediaPipe (client-side)
├── Camera access
└── Database (store measurements)

AI Inventory (10-15 tokens)
├── Token System (check balance)
├── Google Gemini AI
├── Database (sales history)
└── Forecasting algorithms

Token System (Revenue source)
├── Paystack integration
├── Database (transactions)
└── Webhook handlers
```

## 🔄 State Management

```
Client State (React Hooks)
├── useState - Component state
├── useEffect - Side effects
└── Custom hooks - Reusable logic

Server State (Database)
├── Token balances
├── Measurements
├── Inventory data
└── Transaction history

No Global State Library
- React Context for auth (future)
- Props for component data
- API calls for server data
```

## 📊 Performance Optimizations

```
Next.js Features Used:
├── App Router - File-based routing
├── Server Components - Reduced JS bundle
├── API Routes - Backend endpoints
├── Image Optimization - Automatic
└── Code Splitting - Automatic

Database Optimizations:
├── Indexes on vendorId columns
├── Connection pooling
└── Prepared statements (Drizzle)

Client Optimizations:
├── Lazy loading components
├── MediaPipe runs in web worker
└── Minimal dependencies
```

## 🌐 Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Vercel Edge Network           │
│  (CDN + Edge Functions)                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Next.js Application             │
│  - Static pages cached                  │
│  - API routes serverless                │
│  - Auto-scaling                         │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │   External   │
│   Database   │   │   Services   │
│  (Vercel/    │   │  - Gemini    │
│   Supabase)  │   │  - Paystack  │
└──────────────┘   └──────────────┘
```

## 🔄 CI/CD Pipeline (Recommended)

```
GitHub Push
    │
    ▼
┌─────────────┐
│   GitHub    │
│   Actions   │
│  - Lint     │
│  - Test     │
│  - Build    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Vercel    │
│   Deploy    │
│  - Preview  │
│  - Prod     │
└─────────────┘
```

## 📈 Scaling Strategy

```
Phase 1 (Current): Single Instance
- Next.js on Vercel
- PostgreSQL single instance
- Supports ~1,000 vendors

Phase 2 (Growth): Horizontal Scaling
- Add read replicas
- CDN for images
- Redis cache layer

Phase 3 (Scale): Full Distribution
- Multi-region deployment
- Database sharding by vendor
- Microservices for AI features
```

---

## 🎓 Technology Stack Summary

**Frontend:**
- Next.js 15 (React 19)
- TypeScript
- Tailwind CSS
- Radix UI + shadcn/ui

**Backend:**
- Next.js API Routes
- Drizzle ORM
- PostgreSQL / SQLite

**AI & ML:**
- MediaPipe (pose detection)
- Google Gemini 2.0 Flash

**Payments:**
- Paystack API

**Hosting:**
- Vercel (recommended)
- Any Node.js platform

---

**Architecture Version:** 1.0
**Last Updated:** June 19, 2026
