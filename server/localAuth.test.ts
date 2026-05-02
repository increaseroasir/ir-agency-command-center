import { describe, expect, it } from "vitest";
import { validateCredentials, signLocalJwt, verifyLocalJwt } from "./lib/localAuth";

// ─── validateCredentials ──────────────────────────────────────────────────────

describe("validateCredentials", () => {
  it("returns a user object for valid alex credentials", () => {
    const user = validateCredentials("alex", "IncreaseRoas313!");
    expect(user).not.toBeNull();
    expect(user?.username).toBe("alex");
    expect(user?.displayName).toBe("Alex");
  });

  it("returns a user object for valid willy credentials", () => {
    const user = validateCredentials("willy", "IncreaseRoas313!");
    expect(user).not.toBeNull();
    expect(user?.username).toBe("willy");
  });

  it("returns a user object for valid anthony credentials", () => {
    const user = validateCredentials("anthony", "IncreaseRoas313!");
    expect(user).not.toBeNull();
    expect(user?.username).toBe("anthony");
  });

  it("returns null for an unknown username", () => {
    const user = validateCredentials("unknown", "IncreaseRoas313!");
    expect(user).toBeNull();
  });

  it("returns null for a wrong password", () => {
    const user = validateCredentials("alex", "wrongpassword");
    expect(user).toBeNull();
  });

  it("returns null for empty username", () => {
    const user = validateCredentials("", "IncreaseRoas313!");
    expect(user).toBeNull();
  });

  it("returns null for empty password", () => {
    const user = validateCredentials("alex", "");
    expect(user).toBeNull();
  });

  it("normalizes username to lowercase (Alex matches alex)", () => {
    const user = validateCredentials("Alex", "IncreaseRoas313!");
    // validateCredentials applies toLowerCase, so "Alex" resolves to "alex"
    expect(user).not.toBeNull();
    expect(user?.username).toBe("alex");
  });

  it("is case-sensitive for password", () => {
    const user = validateCredentials("alex", "increaseroas313!");
    expect(user).toBeNull();
  });
});

// ─── JWT round-trip ───────────────────────────────────────────────────────────

describe("JWT sign and verify", () => {
  it("signs a JWT and verifies it successfully", async () => {
    const user = validateCredentials("alex", "IncreaseRoas313!")!;
    expect(user).not.toBeNull();

    const token = await signLocalJwt(user);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // valid JWT structure

    const decoded = await verifyLocalJwt(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.username).toBe("alex");
    expect(decoded?.displayName).toBe("Alex");
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyLocalJwt("invalid.token.here");
    expect(result).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const result = await verifyLocalJwt("");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const user = validateCredentials("willy", "IncreaseRoas313!")!;
    const token = await signLocalJwt(user);
    // Tamper with the payload segment
    const parts = token.split(".");
    parts[1] = btoa(JSON.stringify({ username: "hacker", displayName: "Hacker" }));
    const tampered = parts.join(".");
    const result = await verifyLocalJwt(tampered);
    expect(result).toBeNull();
  });
});
