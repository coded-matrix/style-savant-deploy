const CONSUMER_TOKEN_KEY = "ss-consumer-token";
const VENDOR_TOKEN_KEY = "ss-vendor-token";
const ADMIN_TOKEN_KEY = "ss-admin-token";
const LEGACY_TOKEN_KEY = "ss-token";
const LEGACY_SESSION_KEY = "ss-session";

const isBrowser = typeof window !== "undefined";

/* ------------------------------------------------------------------ */
/*  Consumer token                                                      */
/* ------------------------------------------------------------------ */

export function getConsumerToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(CONSUMER_TOKEN_KEY);
}

export function setConsumerToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(CONSUMER_TOKEN_KEY, token);
}

export function clearConsumerToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem(CONSUMER_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

/* ------------------------------------------------------------------ */
/*  Vendor token                                                        */
/* ------------------------------------------------------------------ */

export function getVendorToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(VENDOR_TOKEN_KEY);
}

export function setVendorToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(VENDOR_TOKEN_KEY, token);
}

export function clearVendorToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem(VENDOR_TOKEN_KEY);
}

/* ------------------------------------------------------------------ */
/*  Admin token                                                        */
/* ------------------------------------------------------------------ */

export function getAdminToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/* ------------------------------------------------------------------ */
/*  Legacy compatibility — getToken returns whichever exists            */
/*  (consumer-first). Only used by shared code (e.g. /me endpoint).    */
/* ------------------------------------------------------------------ */

export function getToken(): string | null {
  if (!isBrowser) return null;
  return (
    localStorage.getItem(CONSUMER_TOKEN_KEY) ??
    localStorage.getItem(VENDOR_TOKEN_KEY) ??
    localStorage.getItem(ADMIN_TOKEN_KEY) ??
    localStorage.getItem(LEGACY_TOKEN_KEY)
  );
}

/** @deprecated Use setConsumerToken, setVendorToken, or setAdminToken instead */
export function setToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

/** @deprecated Use clearConsumerToken, clearVendorToken, or clearAdminToken instead */
export function clearToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem(CONSUMER_TOKEN_KEY);
  localStorage.removeItem(VENDOR_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

/* ------------------------------------------------------------------ */
/*  Migrate any legacy "ss-token" into the correct role-specific key.  */
/*  Call once at boot (e.g. in a layout or provider).                  */
/* ------------------------------------------------------------------ */

export function migrateLegacyToken(role: "customer" | "vendor"): void {
  if (!isBrowser) return;
  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacy) return;
  if (role === "vendor") {
    setVendorToken(legacy);
  } else {
    setConsumerToken(legacy);
  }
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export const __isBrowser = isBrowser;
export const __CONSUMER_TOKEN_KEY = CONSUMER_TOKEN_KEY;
export const __VENDOR_TOKEN_KEY = VENDOR_TOKEN_KEY;
export const __LEGACY_TOKEN_KEY = LEGACY_TOKEN_KEY;
export const __LEGACY_SESSION_KEY = LEGACY_SESSION_KEY;

/* ------------------------------------------------------------------ */
/*  Decode JWT payload (no verification — just base64 decode).          */
/*  Used to check if the token contains a valid vendorId.              */
/* ------------------------------------------------------------------ */

export interface JwtPayload {
  userId?: string;
  role?: string;
  vendorId?: string;
  exp?: number;
  iat?: number;
}

export function decodeTokenPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function isVendorTokenValid(): boolean {
  const token = getVendorToken();
  if (!token) return false;
  const payload = decodeTokenPayload(token);
  if (!payload) return false;
  // Must have vendorId and must not be expired
  if (!payload.vendorId) return false;
  if (payload.exp && payload.exp * 1000 < Date.now()) return false;
  return true;
}