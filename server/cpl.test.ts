import { describe, expect, it } from "vitest";
import { calculateCpl } from "./lib/cplCalculator";

describe("calculateCpl", () => {
  it("returns gray when leads is 0", () => {
    const result = calculateCpl(500, 0, 35, 50);
    expect(result.cpl).toBeNull();
    expect(result.color).toBe("gray");
  });

  it("returns green when CPL is below greenMax", () => {
    const result = calculateCpl(300, 10, 35, 50); // CPL = 30
    expect(result.cpl).toBe(30);
    expect(result.color).toBe("green");
  });

  it("returns orange when CPL is between greenMax and orangeMax", () => {
    const result = calculateCpl(400, 10, 35, 50); // CPL = 40
    expect(result.cpl).toBe(40);
    expect(result.color).toBe("orange");
  });

  it("returns red when CPL equals orangeMax", () => {
    const result = calculateCpl(500, 10, 35, 50); // CPL = 50
    expect(result.cpl).toBe(50);
    expect(result.color).toBe("red");
  });

  it("returns red when CPL is above orangeMax", () => {
    const result = calculateCpl(700, 10, 35, 50); // CPL = 70
    expect(result.cpl).toBe(70);
    expect(result.color).toBe("red");
  });

  it("handles fractional CPL correctly", () => {
    const result = calculateCpl(100, 3, 35, 50); // CPL ≈ 33.33
    expect(result.cpl).toBeCloseTo(33.33, 1);
    expect(result.color).toBe("green");
  });

  it("handles zero spend with leads (CPL = 0, green)", () => {
    const result = calculateCpl(0, 5, 35, 50); // CPL = 0
    expect(result.cpl).toBe(0);
    expect(result.color).toBe("green");
  });
});
