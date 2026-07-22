import { getConsumerToken, getVendorToken, getAdminToken, clearVendorToken, clearConsumerToken, clearAdminToken, __isBrowser } from "./token";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    let message: string;
    if (typeof payload === "string") {
      message = payload;
    } else if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      // Extract a clean message from common backend error shapes
      if (typeof obj.error === "string") {
        message = obj.error;
      } else if (typeof obj.message === "string") {
        message = obj.message;
      } else {
        message = JSON.stringify(payload);
      }
    } else {
      message = `Request failed with status ${status}`;
    }
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export type ApiBody =
  | BodyInit
  | null
  | undefined
  | string
  | number
  | boolean
  | object
  | unknown[];

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: ApiBody;
}

/** Pick the right JWT based on the API path being called. */
function resolveToken(path: string): string | null {
  if (path.includes("/admin")) {
    return getAdminToken();
  }
  if (
    path.includes("/vendor/") ||
    path.includes("/vendor-") ||
    path.includes("/campaign") ||
    path.includes("/inventory") ||
    path.includes("/uploads") ||
    path.includes("/billing")
  ) {
    return getVendorToken();
  }
  // Video campaign requests serve two portals: vendors submit them, the
  // admin fulfills them. Pick the JWT matching the portal we're rendered in.
  if (path.includes("/video-requests")) {
    if (window.location.pathname.startsWith("/admin")) return getAdminToken();
    return getVendorToken();
  }
  return getConsumerToken();
}

export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {},
): Promise<Response> {
  const { body, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (
    !headers.has("Content-Type") &&
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (__isBrowser) {
    const token = resolveToken(path);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let serializedBody: BodyInit | undefined;
  if (body === undefined || body === null) {
    serializedBody = undefined;
  } else if (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    typeof body === "string"
  ) {
    serializedBody = body as BodyInit;
  } else if (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body)
  ) {
    serializedBody = JSON.stringify(body);
  } else {
    serializedBody = JSON.stringify(body);
  }

  const res = await fetch(path, {
    ...rest,
    headers,
    body: serializedBody,
  });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      try {
        payload = await res.text();
      } catch {
        payload = null;
      }
    }

    // Auto-logout only on 401 (invalid or expired authentication).
    // A 403 means the session is valid but the action is not permitted;
    // clearing the token there incorrectly sends vendors back to login.
    if (res.status === 401) {
      if (__isBrowser) {
        const currentPath = window.location.pathname;
        const isAdminRoute = currentPath.startsWith("/admin");
        const isVendorRoute = currentPath.startsWith("/vendor");
        const isOnPublicRoute =
          currentPath.startsWith("/vendor/login") ||
          currentPath.startsWith("/vendor/signup") ||
          currentPath.startsWith("/vendor/subscription") ||
          currentPath.startsWith("/admin/login");
        if (!isOnPublicRoute) {
          if (isAdminRoute) {
            clearAdminToken();
            window.location.href = "/admin/login";
          } else if (isVendorRoute) {
            clearVendorToken();
            window.location.href = "/vendor/login";
          } else {
            clearConsumerToken();
            window.location.href = "/login";
          }
        }
      }
    }

    throw new ApiError(res.status, payload);
  }

  return res;
}

export async function apiJson<T = unknown>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  return (await res.json()) as T;
}
