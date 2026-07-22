# Style Savant — Frontend

AI-powered fashion marketplace for Ghanaian vendors and consumers. Two portals
under one Next.js 15 deployment: a **Vendor Portal** for storefront/inventory
management and a **Consumer App** (the "Savant") for browsing, try-on, and
purchasing.

## Quick start

### Prerequisites

- **Node.js** >= 18
- **Docker** (for Postgres)
- **npm**

### 1. Start the database

```bash
docker run -d --name style-savant-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=coded_app \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Start the backend (separate terminal)

```bash
cd ../application-service-backend
cp .env.example .env
npm install
npm run db:generate && npm run db:migrate
npm run db:seed          # optional — loads mock data
npm run dev              # http://localhost:3001
```

### 3. Start the frontend

```bash
cp .env.example .env
npm install
npm run dev              # http://localhost:3000
```

### 4. Open the app

| Page | URL |
|------|-----|
| Consumer app | http://localhost:3000/savant |
| Vendor portal | http://localhost:3000/vendor/dashboard |
| Admin portal | http://localhost:3000/admin/dashboard |
| Product feed | http://localhost:3000/savant/feed |
| Explore | http://localhost:3000/savant/explore |
| Virtual try-on | http://localhost:3000/savant/studio |
| AI body scanner | http://localhost:3000/measurement |

---

## Credentials

### Create accounts

Register via the API or use the frontend signup pages:

```bash
# Admin account
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stylesavant.com","password":"admin123","name":"Admin","role":"admin"}'

# Vendor account
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@stylesavant.com","password":"vendor123","name":"Ama Threads","role":"vendor","businessName":"Ama Threads"}'

# Customer account
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@stylesavant.com","password":"customer123","name":"Kofi","role":"customer"}'
```

### Login pages

| Portal | URL | Notes |
|--------|-----|-------|
| Consumer | http://localhost:3000/savant/auth | Email + password |
| Vendor | http://localhost:3000/vendor/login | Email + password |
| Admin | http://localhost:3000/admin/login | Email + password (dedicated login) |

### Default test credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@stylesavant.com | admin123 |
| Vendor | vendor@stylesavant.com | vendor123 |
| Customer | customer@stylesavant.com | customer123 |

**Note:** Each portal has its own JWT stored under a separate localStorage key:
- Consumer: `ss-consumer-token`
- Vendor: `ss-vendor-token`
- Admin: `ss-admin-token`

Logging into one portal does not affect the others.

---

## Architecture

```
Browser  ──►  Next.js  (:3000)
              │
              │   /api/backend/*  ──►  Express  (:3001)  ──►  Postgres (Docker :5432)
              │
              └──►  Static assets, SSR, client-side routing
```

All backend calls route through Next.js middleware (`middleware.ts`) which
proxies `/api/backend/*` to `http://localhost:3001/api/*`. When the backend is
unreachable, a built-in mock handler serves catalog data so the app stays
browsable offline.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 3, Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Validation | Zod |
| Testing | Vitest + jsdom |
| Styling | "Modern Afro-Surrealist" monochrome design system |

---

## Consumer app (`/savant`)

The Savant is a mobile-first fashion marketplace with rich animations and
AI-powered features.

### Pages

| Route | Description |
|-------|-------------|
| `/savant` | Splash / onboarding screen |
| `/savant/auth` | Login / signup |
| `/savant/feed` | TikTok-style vertical product feed with infinite scroll |
| `/savant/explore` | Filterable product grid (category, price, size, art style) |
| `/savant/search` | Debounced search with recent/popular suggestions |
| `/savant/rank` | Community ranking — vote on looks |
| `/savant/studio` | AI outfit builder (5-slot: Top/Bottom/Shoes/Accessory/Outerwear) |
| `/savant/outfit` | Outfit assembly with product suggestions |
| `/savant/product/[id]` | Product detail with parallax scroll, size/color selectors |
| `/savant/vendor/[id]` | Vendor storefront (consumer view) |
| `/savant/artist/[id]` | Artist profile and backdrop gallery |
| `/savant/cart` | Shopping cart with quantity controls |
| `/savant/checkout` | 3-step checkout (Shipping → Payment → Confirmation) |
| `/savant/order/[id]` | Order confirmation |
| `/savant/gallery` | Virtual try-on image gallery |
| `/savant/saved` | Saved looks and wishlist |
| `/savant/profile` | User profile, measurements, settings |
| `/savant/profile/upload` | Fit profile photo upload |

### Key features

- **TikTok-style feed** — Full-screen vertical snap scroll with cursor-based
  pagination. IntersectionObserver triggers the next page fetch at 300px from
  bottom.
- **AI virtual try-on** — Upload a photo, select a garment, AI composites it
  onto your body. Results saved to gallery. Costs 20 tokens.
- **Studio outfit builder** — 5-slot outfit assembly from live inventory.
  Drafts persist to localStorage with 24h expiry.
- **AI body scanner** — Camera-based measurement using MediaPipe Pose. Calculates
  chest, waist, hips, inseam, sleeve, and height.
- **Community looks** — Users vote on styled outfits. Rankings feed surfaces
  top looks.
- **Backdrop system** — Select artist-created backdrops for try-on scenes.
- **Dual-image products** — `images` (display) and `clothImages` (garment-only
  for AI try-on).
- **Film-grain / curtain-reveal animations** — Cinematic transitions via
  Framer Motion.

---

## Vendor portal (`/vendor`)

A full-featured dashboard for managing a fashion business.

### Pages

| Route | Description |
|-------|-------------|
| `/vendor/login` | Vendor login |
| `/vendor/signup` | Vendor registration |
| `/vendor/dashboard` | Stats overview (listings, orders, sales, tokens) |
| `/vendor/products` | Product catalog with status filters |
| `/vendor/products/new` | Create product |
| `/vendor/products/edit/[id]` | Edit product |
| `/vendor/orders` | Order management with status filters |
| `/vendor/orders/[id]` | Order detail with stage tracker |
| `/vendor/inventory` | Stock levels, low-stock alerts, AI demand forecast |
| `/vendor/analytics` | Revenue charts, token usage, try-on ROI |
| `/vendor/tokens` | Token bundles, usage history, Paystack integration |
| `/vendor/campaigns` | Campaign history (search, delete, reuse) |
| `/vendor/campaigns/new` | AI campaign creator (copy + image generation) |
| `/vendor/subscription` | Plan selector (Starter/Growth/Pro) |
| `/vendor/subscription/manage` | Manage subscription, downgrade/cancel |
| `/vendor/storefront` | Storefront settings (bio, logo, social links) |
| `/vendor/settings` | Account settings, dark mode, logout |
| `/vendor/notifications` | Notification center with categories |
| `/vendor/payouts` | Earnings, 8% platform fee, withdrawal history |
| `/vendor/measurements` | Bespoke order measurements (view/export CSV) |
| `/vendor/try-on` | AI virtual try-on tool for vendor products |
| `/vendor/backdrops/upload` | Upload custom backdrops |

### Key features

- **Local-first + backend sync** — Mutations update local state immediately,
  then sync to the backend. Failures fall back to a "saved locally" toast.
- **Token-gated AI features** — Virtual try-on (20 tk), campaigns (80 tk),
  demand forecast (50 tk), AI clean (10 tk).
- **Dark mode** — Class-based dark mode with localStorage persistence.
- **Responsive** — Desktop sidebar collapses; mobile uses bottom nav.
- **Page transitions** — Framer Motion fade + slide-up between routes.

---

## Components (49 total)

### Consumer (`components/consumer/`)

31 components including:

- **Layout:** BottomNav, TopBar, DesktopSidebar
- **Data display:** ProductCard, VendorProductTile, SmartImage, SizeSelector
- **Overlays:** BottomSheet, FilterSheet, TryOnSheet, BackdropPicker,
  AddToCartSlideOver
- **Animations:** FilmGrain, CurtainReveal, StaggerGrid, SplitWords,
  NumberFlip, HeartBurst, MagneticButton, FadeIn
- **Onboarding:** OnboardingFlow (username, art styles, backdrop)
- **Misc:** Logo, ThemeToggle, Toaster, EmptyState, Skeleton, Chip, Badge

### Vendor (`components/vendor/`)

10 components: SideNav, TopAppBar, BottomNavBar, ProductForm, shared UI
(PageHeader, StatCard, Chip, badges, EmptyState, Thumb, ConfirmDialog),
TokenPaywall, Toast, Skeleton, ComingSoon, Button.

### Measurement (`components/measurement/`)

1 component: MeasurementScanner — MediaPipe Pose-based body measurement.

---

## State management

| Provider | File | Scope |
|----------|------|-------|
| `AppProvider` | `lib/consumer/store.tsx` (663 lines) | Consumer: user, catalog, cart, orders, saved, Studio draft |
| `VendorProvider` | `context/VendorContext.tsx` (682 lines) | Vendor: products, orders, campaigns, tokens, notifications, storefront |
| `SidebarProvider` | `lib/vendor/sidebar-context.tsx` | Vendor sidebar collapsed state |

---

## API layer

All backend calls go through typed wrappers in `lib/api/`:

| Module | Backend endpoints | Notes |
|--------|------------------|-------|
| `auth.ts` | `POST /api/auth/register`, `login`, `GET /api/auth/me` | JWT storage in localStorage |
| `admin.ts` | `GET/DELETE /api/admin/users`, `GET/PATCH /api/admin/vendors`, `POST /api/admin/tokens/:id/reset`, `POST /api/admin/tokens/:id/credit`, `GET /api/admin/orders` | Admin-only endpoints |
| `catalog.ts` | `GET /api/catalog/*` | Art styles, models, artists, backdrops, vendors, products |
| `vendor.ts` | `GET/PATCH /api/vendor/*`, `GET/POST/DELETE /api/inventory/*` | 505 lines, includes raw-to-domain mappers |
| `order.ts` | `POST /api/orders`, `GET /api/orders/:id` | Consumer checkout |
| `recommendation.ts` | `GET /api/recommendations/feed`, `explore`, `for-you`, `similar` | Cursor-paginated feed |
| `measurement.ts` | `POST /api/measurements`, `GET /api/measurements/me` | Body measurement CRUD |
| `upload.ts` | `POST /api/uploads` | Multipart image upload |
| `token.ts` | localStorage helpers | Consumer, vendor & admin JWT management |

When the backend is unreachable, `lib/mock/handler.ts` serves catalog data
from a built-in mock database.

---

## Testing

```bash
npm run test          # run all tests
npm run test:watch    # watch mode
```

| File | Tests | Coverage |
|------|-------|----------|
| `lib/api/vendor.test.ts` | 26 | API data mappers |
| `lib/api/token.test.ts` | 20 | Token management |
| `lib/consumer/format.test.ts` | 11 | Currency, timeAgo, compactCount |
| **Total** | **57** | |

---

## Design system

"Modern Afro-Surrealist" monochrome editorial palette:

- **Ink** (#141414) — primary text/CTAs
- **Surface Bright** (#F4F3F0) — bone paper background
- **Fonts:** Hanken Grotesk (body), Plus Jakarta Sans (display), Cormorant Garamond (serif)
- Dark mode via CSS class with full variable set

---

## Repo layout

```
app/
  page.tsx                    Root redirect to /savant
  layout.tsx                  Root layout (fonts, theme init)
  globals.css                 Design system CSS variables
  measurement/                AI body scanner (standalone)
  tokens/                     Token purchase + Paystack callback
  vendor/                     Vendor portal (19 routes)
    layout.tsx                Auth gate, sidebar, nav, dark mode
    login/signup              Auth flows
    dashboard                 Overview stats
    products/CRUD             Product management
    orders/CRUD               Order management
    inventory                 Stock + AI forecast
    analytics                 Revenue charts
    tokens                    Token purchases
    campaigns/CRUD            AI marketing campaigns
    subscription/             Plan management
    storefront                Storefront settings
    settings                  Account settings
    notifications             Notification center
    payouts                   Earnings/withdrawals
    measurements              Bespoke measurements
    try-on                    AI virtual try-on
    backdrops/upload          Custom backdrops
  admin/                      Admin portal (own layout, login, dashboard, users, tokens, orders)
  savant/                     Consumer app (18 routes)
    layout.tsx                AppProvider, film grain, sidebar
    auth                      Login/signup
    feed                      TikTok-style vertical feed
    explore                   Product browse/grid
    search                    Search + filters
    rank                      Community look ranking
    studio                    AI outfit builder (5 slots)
    outfit                    Outfit assembly
    cart                      Shopping cart
    checkout                  3-step checkout
    order/[id]                Order confirmation
    product/[id]              Product detail (parallax)
    vendor/[id]               Vendor storefront
    artist/[id]               Artist profile
    gallery                   Try-on image gallery
    saved                     Saved looks + wishlist
    profile/                  User profile + photo upload

components/
  ui/                         3 base primitives (button, card, badge)
  vendor/                     10 vendor components
  consumer/                   31 consumer components
  measurement/                1 scanner component

lib/
  api/                        10 API modules
  vendor/                     types, constants, seed, sidebar-context
  consumer/                   types, store, filter, format, motion, studio-draft, data
  measurement/                types, calculator, mediapipe-loader
  mock/                       offline mock handler + seed data
  utils.ts                    cn(), formatCurrency(), formatDate()

context/
  VendorContext.tsx            Vendor global state (682 lines)

middleware.ts                 Backend proxy (/api/backend/* → http://127.0.0.1:3001/api/*)
```

---

## License

Proprietary — Style Savant © 2026.
