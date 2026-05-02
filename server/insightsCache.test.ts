import { describe, expect, it } from "vitest";

/**
 * Unit tests for insights cache logic.
 * Tests the cache key format, TTL check, and bust behavior
 * without requiring a live database connection.
 */

// ─── Cache key format ─────────────────────────────────────────────────────────

function buildCacheKey(datePreset?: string, since?: number, until?: number): string {
  if (datePreset) return `insights:${datePreset}`;
  return `insights:custom:${since}:${until}`;
}

describe("buildCacheKey", () => {
  it("returns preset-based key for datePreset", () => {
    expect(buildCacheKey("last_30d")).toBe("insights:last_30d");
    expect(buildCacheKey("last_7d")).toBe("insights:last_7d");
    expect(buildCacheKey("this_month")).toBe("insights:this_month");
    expect(buildCacheKey("last_month")).toBe("insights:last_month");
  });

  it("returns custom key for since/until timestamps", () => {
    const key = buildCacheKey(undefined, 1700000000000, 1700086400000);
    expect(key).toBe("insights:custom:1700000000000:1700086400000");
  });
});

// ─── Cache freshness check ────────────────────────────────────────────────────

function isCacheFresh(fetchedAt: Date, ttlMs = 60 * 60 * 1000): boolean {
  return Date.now() - fetchedAt.getTime() < ttlMs;
}

describe("isCacheFresh", () => {
  it("returns true for a cache entry fetched 30 minutes ago", () => {
    const fetchedAt = new Date(Date.now() - 30 * 60 * 1000);
    expect(isCacheFresh(fetchedAt)).toBe(true);
  });

  it("returns false for a cache entry fetched 61 minutes ago", () => {
    const fetchedAt = new Date(Date.now() - 61 * 60 * 1000);
    expect(isCacheFresh(fetchedAt)).toBe(false);
  });

  it("returns false for a cache entry fetched exactly 1 hour ago", () => {
    const fetchedAt = new Date(Date.now() - 60 * 60 * 1000);
    expect(isCacheFresh(fetchedAt)).toBe(false);
  });

  it("returns true for a freshly fetched entry", () => {
    const fetchedAt = new Date();
    expect(isCacheFresh(fetchedAt)).toBe(true);
  });
});

// ─── Bust behavior ────────────────────────────────────────────────────────────

function shouldUseCachedData(bust: boolean, fetchedAt: Date): boolean {
  if (bust) return false;
  return isCacheFresh(fetchedAt);
}

describe("shouldUseCachedData", () => {
  it("returns false when bust=true regardless of cache age", () => {
    const freshCache = new Date();
    expect(shouldUseCachedData(true, freshCache)).toBe(false);
  });

  it("returns true when bust=false and cache is fresh", () => {
    const freshCache = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    expect(shouldUseCachedData(false, freshCache)).toBe(true);
  });

  it("returns false when bust=false but cache is stale", () => {
    const staleCache = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    expect(shouldUseCachedData(false, staleCache)).toBe(false);
  });
});
