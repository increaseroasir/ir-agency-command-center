import { describe, expect, it } from "vitest";
import { resolveDateRange } from "./lib/dateUtils";

describe("resolveDateRange", () => {
  it("returns custom range when sinceMs and untilMs are provided", () => {
    const sinceMs = new Date("2024-01-01").getTime();
    const untilMs = new Date("2024-01-31").getTime();
    const result = resolveDateRange(undefined, sinceMs, untilMs);
    expect(result.sinceMs).toBe(sinceMs);
    expect(result.untilMs).toBe(untilMs);
    expect(result.sinceStr).toBe("2024-01-01");
    expect(result.untilStr).toBe("2024-01-31");
  });

  it("defaults to last_30d when no preset given", () => {
    const result = resolveDateRange();
    const diffDays = (result.untilMs - result.sinceMs) / (1000 * 60 * 60 * 24);
    // Should be approximately 29 days (30 day window)
    expect(diffDays).toBeGreaterThanOrEqual(28);
    expect(diffDays).toBeLessThanOrEqual(30);
  });

  it("returns 7-day range for last_7d", () => {
    const result = resolveDateRange("last_7d");
    const diffDays = (result.untilMs - result.sinceMs) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(5);
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  it("sinceStr and untilStr are valid YYYY-MM-DD strings", () => {
    const result = resolveDateRange("last_30d");
    expect(result.sinceStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.untilStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
