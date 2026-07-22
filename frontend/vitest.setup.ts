import { vi } from "vitest";

// Node 25 exposes an incomplete localStorage global when no storage file is
// configured. Replace it with a deterministic in-memory implementation so
// browser-token tests behave the same in local development and CI.
const values = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, String(value))),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
  },
});
