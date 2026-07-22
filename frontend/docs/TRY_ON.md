# Virtual Try-On ("Agnes") — How It Works

The virtual try-on feature composites a product's garment onto a photo of the
shopper, producing a photorealistic "you wearing this" image. It spans the
consumer frontend (this repo) and the Express backend
(`../application-service-backend`), and calls an external image-editing model
referred to internally as **Agnes**.

This document describes the complete pipeline, the caching model, failure
handling, and the environment configuration it depends on.

---

## 1. End-to-end flow at a glance

```
Consumer UI (TryOnSheet)
   │  POST /api/backend/catalog/tryon  { productId, garmentUrl? }
   ▼
Next.js middleware proxy (Node runtime — no Edge 30s cap)
   │
   ▼
Express  POST /api/catalog/tryon   (authenticate)
   1. Load shopper's fit photo (users.fitPhoto)         ── 400 if missing
   2. Load product                                       ── 404 if missing
   3. Hash the fit photo (sha256) → fitPhotoHash
   4. CACHE LOOKUP  (userId + productId + fitPhotoHash)  ── hit ⇒ return saved image
   5. Detect fit-photo dimensions → target aspect ratio (longer edge ≤ 768px)
   6. Pick the garment image (clothImages/index-1 preferred)
   7. AI background clean  (unless already a transparent PNG / trusted host)
   8. Add white outline border around the garment cutout
   9. Agnes editImage(person, garment, prompt, size, strength=0.45)
      └─ implausible result (<~10 KB) ⇒ retry once ⇒ 502 if still bad
  10. Auto-save result to tryon_gallery (non-blocking)
   ▼
   { image: <base64>, galleryId, cached? }
   ▼
Consumer UI crossfades the product preview → generated look
```

---

## 2. Frontend

### Entry points
The try-on sheet is opened from several places in the consumer portal:

- **Product detail** (`app/savant/product/[id]/page.tsx`) — the **"Try This On"**
  CTA, and a **swipe-left past the last carousel image** gesture on mobile.
- **Feed** (`app/savant/feed/page.tsx`) — the try-on rail button on each post.
- Anywhere else that renders `<TryOnSheet product={…} />`.

### `TryOnSheet` (`components/consumer/TryOnSheet.tsx`)
Responsibilities:

1. **Fit-photo gate.** On open, if `user.fitProfile.photo` is absent, the sheet
   closes, shows a toast, and routes to
   `/savant/profile/upload?returnUrl=…`. Try-on requires a photo of the shopper.
2. **Optimistic preview.** The product image renders immediately with a
   "Generating your look…" spinner overlay.
3. **Kick off the render** via `catalogApi.tryOnProduct(product.id, garmentUrl)`
   where `garmentUrl = product.clothImages?.[0] || product.images?.[0]`.
4. **Crossfade** to `data:image/jpeg;base64,${res.image}` when Agnes returns.
5. **Slow path.** After 8s a "This is taking longer than usual… View without
   try-on" escape hatch appears (`slow` state). The user can bail to the plain
   product image at any time.
6. **Failure path.** On rejection, a neutral toast is shown and the product
   image stays. The sheet never blocks the shopper.
7. From the result the user can **Save Look** (to their gallery/looks) or
   **Add to Cart** (size required), and **Change Item** to try another garment
   from the same vendor without leaving the sheet.

### API wrapper (`lib/api/catalog.ts`)
```ts
catalogApi.tryOnProduct(productId, garmentUrl?)
  → POST /api/backend/catalog/tryon  { productId, garmentUrl }
  → { image: string /* base64 */, galleryId?: string, cached?: boolean }

catalogApi.getGallery()            → GET    /api/backend/catalog/tryon/gallery
catalogApi.deleteGalleryItem(id)   → DELETE /api/backend/catalog/tryon/gallery/:id
```

> **Why the proxy, not a cross-origin call?** Agnes takes 30–110s. The
> `/api/backend/*` middleware proxy runs on the **Node.js runtime**
> (`middleware.ts`), which has no implicit timeout, so the long request isn't
> killed by the Vercel Edge ~30s cap. See the README "Long-running endpoints"
> section.

---

## 3. Backend

Route: `POST /api/catalog/tryon` → `generateTryOn`
(`src/modules/catalog/catalog.controller.ts`), guarded by `authenticate`.
Gallery routes: `GET /tryon/gallery`, `DELETE /tryon/gallery/:id`.

### Step-by-step

1. **Fit photo.** Reads `users.fitPhoto`. Returns **400** if the shopper hasn't
   uploaded one. The photo is uploaded separately via
   `PATCH /api/auth/profile-photo` (`upload.single('photo')`), which stores it on
   the user row (`auth.service.ts` sets `fitPhoto` + `avatar`). The stored value
   may be raw base64, a `data:` URI, or an `http(s)` URL (seed data) — all three
   are normalized into a `Buffer`.

2. **Product.** Loads the product; **404** if not found.

3. **Fit-photo hash.** `sha256(fitPhotoBuffer)` → `fitPhotoHash`. This is the
   cache key component that lets us detect "same person photo."

4. **Cache lookup.** Queries `tryon_gallery` for a row matching
   `(userId, productId, fitPhotoHash)`, newest first. On a hit it returns the
   saved `imageBase64` immediately with `cached: true` — skipping the entire
   Agnes round-trip. A cache-lookup error is logged and treated as a miss
   (non-fatal).

5. **Aspect ratio.** `detectImageSize()` (a dependency-free JPEG/PNG header
   parser in `src/utils/agnes.ts`) reads the photo's dimensions. The longer edge
   is capped at **768px** and the shorter edge scaled proportionally
   (e.g. a portrait becomes `Nx768`). This keeps the output un-distorted and
   keeps the generation fast. Falls back to `768x768` if dimensions can't be
   read.

6. **Garment selection.** Uses the request's `garmentUrl` if provided; otherwise
   prefers `product.images[1]` (the clean cutout/mannequin shot by seed
   convention), falling back to `images[0]`. **400** if the product has no image.

7. **AI background clean.** Fetches the garment image. If it isn't already a
   transparent PNG (or from a trusted host), it runs an "AI Clean" pass through
   `editImage` with a prompt that strips the person/mannequin/background, leaving
   only the garment on white. Clean failures fall back to the original garment
   (non-fatal).

8. **White border.** `addWhiteBorderToGarment()` adds a white outline around the
   cutout — this improves how the model isolates and drapes the garment. Failures
   fall back to the cleaned image.

9. **Agnes generation.** Builds a strict prompt that instructs the model to keep
   the person's face, skin tone, body, pose, hands, background, and lighting
   **exactly** the same and only swap the clothing, then calls
   `editImage(fitPhotoBuffer, 'image/jpeg', prompt, targetSize, garmentBuffer, 0.45)`.
   - `editImage` (`src/utils/agnes.ts`) sends both images as data URIs to
     `${AGNES_BASE_URL}/images/generations`, with up to **3 retries** and an
     abort timeout.
   - It also sanitizes the prompt for the model's naive profanity substring
     filter (the "Scunthorpe problem": `drape`→`draping`, etc.).

10. **Plausibility check + retry.** A real image is typically 50–500 KB of
    base64; anything under ~10 KB is treated as a corrupt/error blob. If the
    first result is implausible, it retries **once**; if still bad, returns
    **502** with a friendly message.

11. **Auto-save to gallery.** On success, inserts the result into `tryon_gallery`
    (`userId, productId, productName, imageBase64, fitPhotoHash`). This both
    powers the user's gallery and seeds the cache for step 4. Save failures are
    logged but do **not** block the response.

12. **Response.** `{ image, galleryId }` (or `{ image, galleryId, cached: true }`
    from the cache path).

### Data model (`src/db/schema.ts`)
`tryon_gallery` columns: `id`, `userId`, `productId`, `productName`,
`imageBase64`, `fitPhotoHash`, `createdAt`. The `fit_photo_hash` column and the
supporting indexes are applied by migration `drizzle/0005_*`.

---

## 4. Caching model

The cache is the `tryon_gallery` table itself, keyed by
**`(userId, productId, fitPhotoHash)`**:

- Same shopper + same product + **same photo** ⇒ instant cache hit, no Agnes cost.
- If the shopper **re-uploads a different photo**, `fitPhotoHash` changes and a
  fresh render is generated (and cached under the new hash).
- Because every successful render is auto-saved, the gallery and the cache are
  the same rows — there's no separate cache store to keep in sync.

---

## 5. Failure & resilience summary

| Situation | Behaviour |
| --- | --- |
| No fit photo | 400; UI redirects shopper to upload |
| Product / image missing | 404 / 400 |
| Fit photo URL unreachable | 502 ("re-upload") |
| Cache lookup errors | logged, treated as miss |
| AI background clean fails | falls back to original garment |
| White-border step fails | falls back to cleaned garment |
| Implausible Agnes output | retry once → 502 if still bad |
| Gallery save fails | logged, image still returned |
| Slow generation | UI shows an 8s "view without try-on" escape hatch |

The guiding principle: **never block the shopper**. Every backend fallback keeps
moving toward a result, and the frontend always has the plain product image to
fall back to.

---

## 6. Configuration

Backend `.env` (see `../application-service-backend/.env.example`):

- `AGNES_*` — base URL, API key(s), timeout, default image size
  (`config.ai.agnesBaseUrl`, `agnesTimeoutMs`, `agnesImageSize`).
- `DATABASE_URL` — try-on gallery / cache storage.
- `DEBUG_TRYON=true` — **optional, dev only.** Dumps the exact `debug_person.jpg`
  and `debug_garment.jpg` inputs sent to Agnes for inspection. Leave unset in
  production (it writes files to disk on every request).

Frontend `.env`:

- `NEXT_PUBLIC_API_URL` — the Express backend origin.

---

## 7. Related product concept: dual-image products

Each product carries two image arrays:

- `images` — model/display photos (what shoppers browse).
- `clothImages` — cloth-only / garment-on-hanger versions, paired by index.

The try-on prefers the cloth-only image so it composites a **clean garment**
rather than re-dressing another model. Vendors upload both in
`components/vendor/ProductForm.tsx`. See the README "Dual-image products & AI
try-on" section.
