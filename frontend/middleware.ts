import { NextRequest, NextResponse } from "next/server";
import { handleMockRequest } from "./lib/mock/handler";

// Run middleware in the Node.js runtime so we can use the full Node.js fetch
// (no implicit Edge timeout) when proxying long-running AI requests to the
// backend. AI endpoints (catalog/tryon, inventory AI, campaign) can take
// 30-110s; the previous rewrite-based proxy was killed by Next.js at ~30s.
export const config = {
  matcher: ["/api/backend/:path*", "/uploads/:path*"],
  runtime: "nodejs",
};

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const backendPath = url.pathname.startsWith("/api/backend")
    ? url.pathname.replace(/^\/api\/backend/, "/api")
    : url.pathname;
  const target = `${BACKEND}${backendPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
    init.body = request.body;
    // @ts-expect-error — `duplex` is required when streaming a request body
    init.duplex = "half";
  }

  let response: Response;
  try {
    response = await fetch(target, init);
  } catch (err) {
    // Upstream backend is unreachable (e.g. local dev without the Express
    // service running). Fall back to the in-repo mock catalog so the entire
    // app stays functional offline. The real backend path is untouched.
    const message = err instanceof Error ? err.message : "Upstream proxy failed";
    const url = new URL(request.url);
    const mock = handleMockRequest(url.pathname, request.method, undefined);
    if (mock) {
      return NextResponse.json(mock.body, { status: mock.status });
    }
    return new NextResponse(
      JSON.stringify({ error: `Upstream proxy failed: ${message}` }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("connection");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
