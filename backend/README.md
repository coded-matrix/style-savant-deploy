# Coded Application Services Backend

This is the backend service for Coded Application Services. It powers two main features for fashion vendors:

1. **Storefront and Inventory Management** lets a vendor add products, manage stock, and optionally clean up product photos with AI.
2. **AI Campaign Creation** lets a vendor turn a product photo plus a short brief into social media copy and a branded campaign image.

It also includes user management (sign up, log in) because a vendor needs an account before they can use anything.

The backend is built with Express and TypeScript. It talks to a PostgreSQL database through Drizzle ORM. The database schema matches the frontend repo exactly, so both sides read and write the same shapes.

## Tech at a glance

- Express and TypeScript
- PostgreSQL with Drizzle ORM
- JWT for login sessions
- Google Gemini for text generation
- Agnes AI for image generation and photo cleaning
- Object storage for product images (local disk in dev; S3 or Cloudinary in production)
- Paystack for token payments (planned next)

## Getting started

1. Copy `.env.example` to `.env` and fill in the values.
2. Install packages:
   ```
   npm install
   ```
3. Create the database tables and apply schema changes:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
4. (Optional) Seed the database with initial mock data:
   ```bash
   npm run db:seed
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

The server runs on `http://localhost:3001` by default.

## How accounts work

There are two kinds of accounts:

- A **customer** can browse and order (frontend features).
- A **vendor** owns a store. Only vendors can manage products and run campaigns.

When someone signs up as a vendor, the backend creates both a user record and a vendor profile.

Every protected request needs a token. You get the token when you register or log in. Send it on every call like this:

```
Authorization: Bearer YOUR_TOKEN
```

## How tokens (credits) work

AI features cost tokens. A vendor buys tokens, and each AI action spends some.

- AI Clean on a photo costs 5 tokens.
- Campaign copy costs 5 tokens.
- Campaign image costs 10 tokens.

A vendor is only charged when the AI work succeeds. If a generation fails, no tokens are taken.

## Endpoints

Base URL: `http://localhost:3001`

### Health

Check that the server and database are up.

```
GET /health
```

Response:
```json
{ "status": "ok", "db": "connected" }
```

### Auth

**Register**
```
POST /api/auth/register
```
Body (JSON):
```json
{
  "email": "ama@shop.com",
  "password": "secret123",
  "name": "Ama",
  "role": "vendor",
  "businessName": "Ama Threads"
}
```
Notes:
- `role` is `customer` or `vendor`. It defaults to `customer`.
- `businessName` is required only when `role` is `vendor`.

Response returns the user, the `vendorId` (if a vendor), and a `token`.

**Log in**
```
POST /api/auth/login
```
Body (JSON):
```json
{ "email": "ama@shop.com", "password": "secret123" }
```
Response returns the user, the `vendorId`, and a fresh `token`.

**Get the current account**
```
GET /api/auth/me
```
Needs a token. Returns the user and, for vendors, the vendor profile.

### Storefront and Inventory (vendors only)

All of these need a vendor token.

**List products**
```
GET /api/inventory
```
Returns the vendor's products without the image data, so the list stays light. Each item includes an `imageCount` instead of the full images.

**Get one product**
```
GET /api/inventory/:id
```
Returns the full product, including its images.

**Add a product**
```
POST /api/inventory
```
Send this as form-data:

| Field | Required | Notes |
| --- | --- | --- |
| name | yes | Product name |
| price | yes | A positive number |
| category | yes | For example, Fashion |
| description | no | Up to 2000 characters |
| stock | no | Whole number, defaults to 0 |
| images | no | JSON array of image URLs (see "Product images" below) |
| clothImages | no | JSON array of cloth-only image URLs, for AI try-on |
| image | no | A single photo file (legacy AI-Clean path) |
| clean | no | Set to `true` to run AI Clean on the uploaded `image` file |

**Two kinds of image per product.** `images` are the model/display photos
consumers see when browsing. `clothImages` are cloth-only (garment laid flat or
on a hanger, no model) versions, paired by index, used **only** by the AI
virtual try-on so it can composite the garment onto a shopper's photo. Upload
both through `POST /api/uploads` first (see below), then send the returned URLs.

If you send a single `image` file with `clean=true`, that photo goes through AI
Clean (background removed, replaced with a studio backdrop). This costs tokens.
Without `clean`, it is stored as-is and costs nothing.

**Update a product**
```
PATCH /api/inventory/:id
```
Body (JSON), send only the fields you want to change:
```json
{ "name": "New name", "price": 280, "published": true, "clothImages": ["https://.../cloth1.jpg"] }
```

**Set stock quantity**
```
PATCH /api/inventory/:id/stock
```
Body (JSON):
```json
{ "stock": 12 }
```

**Delete a product**
```
DELETE /api/inventory/:id
```
Returns an empty response on success.

### Product images (object storage)

Product photos are stored in object storage, not inline in the database. Upload
the raw files first, then reference the returned URLs when you create or update
a product.

**Upload one or more images** (vendors only)
```
POST /api/uploads
```
Send as form-data with the field name `files` (up to 8). Response:
```json
{ "urls": ["http://localhost:3001/uploads/1699999999999-ab12cd.jpg"] }
```
Use these URLs in the product's `images` / `clothImages` arrays.

**Storage drivers.** The backend is storage-agnostic; pick one with the
`STORAGE_DRIVER` environment variable:

| Driver | When to use | Extra setup |
| --- | --- | --- |
| `local` (default) | Local dev | None. Files are written to `STORAGE_LOCAL_DIR` and served at `/uploads`. |
| `s3` | Production on AWS | `npm i @aws-sdk/client-s3`; set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (and optional `S3_PUBLIC_URL` for a CDN). |
| `cloudinary` | Production, image-optimized | `npm i cloudinary`; set `CLOUDINARY_URL`. |

Set `STORAGE_PUBLIC_BASE_URL` to the origin the browser uses to reach the
backend (the `local` driver builds `/uploads` URLs from it). The S3 and
Cloudinary SDKs are optional dependencies loaded only when their driver is
selected, so the default `local` setup needs no extra installs.

### Vendor portal (vendors only)

These power the vendor dashboard, orders, wallet, payouts, and notifications.
All require a vendor token.

| Method & path | What it does |
| --- | --- |
| `GET /api/vendor/dashboard` | Summary stats: business info, active listings, pending orders, sales, net earnings, token balance |
| `GET /api/vendor/storefront` | Storefront settings (name, logo, cover, bio, socials, shipping policy) |
| `PATCH /api/vendor/storefront` | Update storefront settings |
| `GET /api/vendor/orders` | List the vendor's orders |
| `GET /api/vendor/orders/:id` | One order with items and measurements |
| `PATCH /api/vendor/orders/:id/status` | Update order status (`pending` → `shipped` → `delivered`, etc.) |
| `PATCH /api/vendor/orders/:id/tracking` | Attach a tracking number and courier |
| `GET /api/vendor/tokens/balance` | Current token balance |
| `POST /api/vendor/tokens/buy` | Credit purchased tokens (`{ amount, reference }`) |
| `GET /api/vendor/campaigns` | List saved campaigns |
| `POST /api/vendor/campaigns` | Save a campaign |
| `GET /api/vendor/payouts` | Payout summary: net earnings, available balance, connected bank |
| `GET /api/vendor/notifications` | List the vendor's notifications (newest first, max 50) |
| `PATCH /api/vendor/notifications/read-all` | Mark all notifications as read |

**Notifications** are generated automatically by server-side events:

- A new order for the vendor → an `orders` notification.
- Stock dropping to 3 or fewer (or 0) via `PATCH /api/inventory/:id/stock` → a
  `stock` notification.

Categories are `orders`, `stock`, `tokens`, `payouts`, and `system`. Producers
are best-effort — a notification failure never blocks the underlying action.

### AI Campaign Creation (vendors only)

All of these need a vendor token and an active token balance.

**List audiences**
```
GET /api/campaign/audiences
```
Returns the audience options you can target: `domestic` and `international`.

**Generate marketing copy**
```
POST /api/campaign/text
```
Send this as form-data:

| Field | Required | Notes |
| --- | --- | --- |
| product | yes | A product photo file |
| prompt | yes | A short brief, for example "Bold summer dress sale" |
| audience | yes | `domestic` or `international` |

Response:
```json
{
  "caption": "Slay the summer heat with our new bold dresses!",
  "hashtags": ["#GhanaFashion", "#SummerStyle", "#SaleAlert"],
  "ad_text": "Ghana, get ready! Our bold summer dress sale is here."
}
```

**Generate a campaign image**
```
POST /api/campaign/image
```
Same form-data as the copy endpoint (product, prompt, audience).

Response:
```json
{ "image": "BASE64_STRING_HERE" }
```
The image comes back as base64. To view it, put it inside an image tag like this:
```
data:image/png;base64,BASE64_STRING_HERE
```

## Status codes you may see

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 204 | Success, nothing to return (delete) |
| 400 | Bad input |
| 401 | Missing or invalid token |
| 402 | Not enough tokens |
| 403 | Logged in, but not allowed (for example, a customer trying vendor actions) |
| 404 | Not found |
| 409 | Conflict (for example, email already registered) |

## Settings

Almost everything is configurable through environment variables, so you can change behavior without editing code. See `.env.example` for the full list, including AI model names, token costs, rate limits, timeouts, session length, and the object-storage driver (`STORAGE_DRIVER` and its `S3_*` / `CLOUDINARY_*` companions).

## A note for the team

This backend and the frontend repo share one database. To avoid clashes, only one side should run migrations in production. Also, the shared AI feature list does not yet include a campaign type, so campaign token usage is recorded in the token ledger for now. Adding `campaign_copy` and `campaign_image` to the shared list would make this first class.
