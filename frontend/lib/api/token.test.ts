import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getConsumerToken, setConsumerToken, clearConsumerToken,
  getVendorToken, setVendorToken, clearVendorToken,
  getToken, setToken, clearToken,
  migrateLegacyToken,
  decodeTokenPayload, isVendorTokenValid,
  __CONSUMER_TOKEN_KEY, __VENDOR_TOKEN_KEY, __LEGACY_TOKEN_KEY, __LEGACY_SESSION_KEY,
} from './token';

describe('token management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('consumer token', () => {
    it('set/get round-trips', () => {
      setConsumerToken('consumer-jwt-123');
      expect(getConsumerToken()).toBe('consumer-jwt-123');
    });

    it('clearConsumerToken removes consumer, legacy token, and session', () => {
      localStorage.setItem(__CONSUMER_TOKEN_KEY, 'c-token');
      localStorage.setItem(__LEGACY_TOKEN_KEY, 'legacy-token');
      localStorage.setItem(__LEGACY_SESSION_KEY, '{"user":"test"}');

      clearConsumerToken();

      expect(localStorage.getItem(__CONSUMER_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(__LEGACY_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(__LEGACY_SESSION_KEY)).toBeNull();
    });
  });

  describe('vendor token', () => {
    it('set/get round-trips', () => {
      setVendorToken('vendor-jwt-456');
      expect(getVendorToken()).toBe('vendor-jwt-456');
    });

    it('clearVendorToken only removes vendor token', () => {
      localStorage.setItem(__VENDOR_TOKEN_KEY, 'v-token');
      localStorage.setItem(__CONSUMER_TOKEN_KEY, 'c-token');

      clearVendorToken();

      expect(localStorage.getItem(__VENDOR_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(__CONSUMER_TOKEN_KEY)).toBe('c-token');
    });
  });

  describe('getToken (legacy)', () => {
    it('prefers consumer token', () => {
      localStorage.setItem(__CONSUMER_TOKEN_KEY, 'c-token');
      localStorage.setItem(__VENDOR_TOKEN_KEY, 'v-token');
      expect(getToken()).toBe('c-token');
    });

    it('falls back to vendor token', () => {
      localStorage.setItem(__VENDOR_TOKEN_KEY, 'v-token');
      expect(getToken()).toBe('v-token');
    });

    it('falls back to legacy token', () => {
      localStorage.setItem(__LEGACY_TOKEN_KEY, 'legacy-token');
      expect(getToken()).toBe('legacy-token');
    });

    it('returns null when nothing stored', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('setToken (legacy)', () => {
    it('sets the legacy token key', () => {
      setToken('legacy-jwt');
      expect(localStorage.getItem(__LEGACY_TOKEN_KEY)).toBe('legacy-jwt');
    });
  });

  describe('clearToken (legacy)', () => {
    it('removes all token and session keys', () => {
      localStorage.setItem(__CONSUMER_TOKEN_KEY, 'c');
      localStorage.setItem(__VENDOR_TOKEN_KEY, 'v');
      localStorage.setItem(__LEGACY_TOKEN_KEY, 'l');
      localStorage.setItem(__LEGACY_SESSION_KEY, 's');

      clearToken();

      expect(localStorage.getItem(__CONSUMER_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(__VENDOR_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(__LEGACY_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(__LEGACY_SESSION_KEY)).toBeNull();
    });
  });

  describe('migrateLegacyToken', () => {
    it('moves legacy token to consumer key for customer role', () => {
      localStorage.setItem(__LEGACY_TOKEN_KEY, 'old-jwt');
      migrateLegacyToken('customer');
      expect(localStorage.getItem(__CONSUMER_TOKEN_KEY)).toBe('old-jwt');
      expect(localStorage.getItem(__LEGACY_TOKEN_KEY)).toBeNull();
    });

    it('moves legacy token to vendor key for vendor role', () => {
      localStorage.setItem(__LEGACY_TOKEN_KEY, 'old-jwt');
      migrateLegacyToken('vendor');
      expect(localStorage.getItem(__VENDOR_TOKEN_KEY)).toBe('old-jwt');
      expect(localStorage.getItem(__LEGACY_TOKEN_KEY)).toBeNull();
    });

    it('does nothing when no legacy token exists', () => {
      migrateLegacyToken('customer');
      expect(getConsumerToken()).toBeNull();
    });
  });
});

describe('decodeTokenPayload', () => {
  it('decodes a valid JWT payload', () => {
    const payload = { userId: 'u-1', role: 'vendor', vendorId: 'v-1', exp: 9999999999 };
    const encoded = btoa(JSON.stringify(payload));
    const token = `header.${encoded}.signature`;

    const result = decodeTokenPayload(token);
    expect(result).toEqual(payload);
  });

  it('returns null for invalid token format', () => {
    expect(decodeTokenPayload('not-a-jwt')).toBeNull();
    expect(decodeTokenPayload('')).toBeNull();
    expect(decodeTokenPayload('a.b')).toBeNull();
  });

  it('returns null for malformed payload', () => {
    expect(decodeTokenPayload('header.!!!.sig')).toBeNull();
  });
});

describe('isVendorTokenValid', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when no token stored', () => {
    expect(isVendorTokenValid()).toBe(false);
  });

  it('returns false for consumer token', () => {
    const payload = { userId: 'u-1', role: 'customer', exp: 9999999999 };
    const token = `header.${btoa(JSON.stringify(payload))}.sig`;
    setVendorToken(token);
    expect(isVendorTokenValid()).toBe(false);
  });

  it('returns true for valid vendor token with vendorId', () => {
    const payload = { userId: 'u-1', role: 'vendor', vendorId: 'v-1', exp: 9999999999 };
    const token = `header.${btoa(JSON.stringify(payload))}.sig`;
    setVendorToken(token);
    expect(isVendorTokenValid()).toBe(true);
  });

  it('returns false for expired vendor token', () => {
    const payload = { userId: 'u-1', role: 'vendor', vendorId: 'v-1', exp: 1000000000 }; // expired
    const token = `header.${btoa(JSON.stringify(payload))}.sig`;
    setVendorToken(token);
    expect(isVendorTokenValid()).toBe(false);
  });
});
