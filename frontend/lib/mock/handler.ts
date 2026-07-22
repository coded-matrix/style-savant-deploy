// Resolves an /api/backend/* request against the in-repo mock catalog when the
// upstream Express backend is unreachable. Keeping this in its own module makes
// the real-backend path (middleware.ts) and the offline fallback easy to reason
// about. Add new GET routes here; any unmatched path returns a 200 { ok: true }
// so client mutations (auth/orders/etc.) don't hard-fail offline.

import { MOCK_DB } from "./seed";

interface MockResult {
  status: number;
  body: unknown;
}

function productById(id: string) {
  return MOCK_DB.products.find((p) => p.id === id);
}

export function handleMockRequest(
  pathname: string,
  method: string,
  body: unknown,
): MockResult {
  // Strip the /api/backend prefix; the backend exposes /api/...
  const p = pathname.replace(/^\/api\/backend/, "/api");

  // ---- Catalog GETs (rendering-critical) ----
  if (method === "GET") {
    if (p === "/api/catalog/art-styles") return ok(MOCK_DB.artStyles);
    if (p === "/api/catalog/preset-models") return ok(MOCK_DB.presetModels);
    if (p === "/api/catalog/artists") return ok(MOCK_DB.artists);
    if (p === "/api/catalog/backdrops") return ok(MOCK_DB.backdrops);
    if (p === "/api/catalog/vendors") return ok(MOCK_DB.vendors);
    if (p === "/api/catalog/products") return ok(MOCK_DB.products);

    const productMatch = p.match(/^\/api\/catalog\/products\/(.+)$/);
    if (productMatch) {
      const prod = productById(productMatch[1]);
      return prod ? ok(prod) : { status: 404, body: { error: "Not found" } };
    }

    if (p === "/api/catalog/looks") return ok(MOCK_DB.looks);

    // ---- Recommendations GETs (feed/explore/rank) ----
    if (p === "/api/recommendations/feed") {
      const url = new URL(p, "http://localhost");
      // The actual search params are on the original pathname
      const origUrl = new URL(pathname, "http://localhost");
      const limit = parseInt(origUrl.searchParams.get("limit") || "5");
      const cursor = origUrl.searchParams.get("cursor");
      let items = [...MOCK_DB.looks];
      if (cursor) {
        const cursorScore = parseFloat(cursor);
        // Mock: just skip past items with index <= cursorScore (simplified)
        items = items.slice(Math.min(Math.ceil(cursorScore), items.length));
      }
      const page = items.slice(0, limit);
      const nextCursor = items.length > limit ? items.length - limit + (parseFloat(cursor || "0")) : null;
      return ok({ items: page, nextCursor });
    }
    if (p === "/api/recommendations/explore") return ok(MOCK_DB.products);
    if (p === "/api/recommendations/for-you") return ok(MOCK_DB.products);
    const similarMatch = p.match(/^\/api\/recommendations\/similar\/(.+)$/);
    if (similarMatch) {
      const lead = productById(similarMatch[1]);
      const sameVendor = MOCK_DB.products.filter(
        (x) => x.vendorId === lead?.vendorId && x.id !== lead?.id,
      );
      return ok(sameVendor.length ? sameVendor : MOCK_DB.products.slice(0, 4));
    }
  }

  // ---- Generic success for unmatched paths (mutations, auth, etc.) ----
  // Returns a plausible body so the UI flow (login, order creation) completes
  // without a real backend.
  if (method === "POST") {
    if (p === "/api/auth/login" || p === "/api/auth/register") {
      return ok({ token: "mock-token", user: { name: "Demo User", avatar: "" } });
    }
    if (p === "/api/orders") {
      return ok({ id: `SS-${Math.floor(1000 + Math.random() * 9000)}`, ok: true });
    }
    return ok({ ok: true, id: `mock-${Date.now()}` });
  }
  if (method === "PUT" || method === "PATCH" || method === "DELETE") {
    return ok({ ok: true });
  }

  return { status: 404, body: { error: "Mock route not found", path: p } };
}

function ok(body: unknown): MockResult {
  return { status: 200, body };
}
