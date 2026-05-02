/**
 * Unit tests for GHL API pagination logic.
 * Tests the early-exit strategy: stop when last contact on a page is before sinceMs.
 * Uses mocked axios to avoid real network calls.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";

// Mock axios before importing the module under test
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// We need to import after mocking
const { fetchGhlLeadCount } = await import("./lib/ghlApi");

const LOCATION_ID = "test-location-123";
const PRIVATE_TOKEN = "pit-test-token";

// Helper to build a mock contact.
// GHL API returns 'contactName' (not 'name') for the full contact name.
function makeContact(id: string, dateAdded: string, hasAll = true) {
  return {
    id,
    contactName: hasAll ? "John Doe" : null,
    firstName: hasAll ? "John" : null,
    lastName: hasAll ? "Doe" : null,
    email: hasAll ? "john@example.com" : null,
    phone: hasAll ? "+15551234567" : null,
    dateAdded,
  };
}

// Helper to build a mock GHL page response
function makePage(contacts: ReturnType<typeof makeContact>, meta?: object) {
  return {
    data: {
      contacts,
      meta: meta ?? {
        total: 1000,
        currentPage: 1,
        startAfter: contacts.length > 0
          ? new Date(contacts[contacts.length - 1].dateAdded).getTime()
          : undefined,
        startAfterId: contacts.length > 0 ? contacts[contacts.length - 1].id : undefined,
      },
    },
  };
}

describe("fetchGhlLeadCount — early-exit pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when the first page is empty", async () => {
    mockedAxios.get = vi.fn().mockResolvedValueOnce(makePage([]));
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, 1_000_000, 2_000_000);
    expect(count).toBe(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("exits early when last contact on first page is before sinceMs", async () => {
    // All contacts are from before the date range
    const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
    const untilMs = new Date("2026-05-02T23:59:59.999Z").getTime();

    const contacts = [
      makeContact("c1", "2026-03-15T10:00:00.000Z"), // before sinceMs
      makeContact("c2", "2026-03-01T10:00:00.000Z"), // before sinceMs
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce(makePage(contacts));

    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(0);
    // Should only fetch 1 page because last contact is before sinceMs
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("counts leads from first page and exits early on second page", async () => {
    const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
    const untilMs = new Date("2026-05-02T23:59:59.999Z").getTime();

    // Page 1: 2 contacts in range, last contact still in range → continue
    const page1Contacts = [
      makeContact("c1", "2026-04-20T10:00:00.000Z"),
      makeContact("c2", "2026-04-10T10:00:00.000Z"),
    ];
    // Page 2: 2 contacts, last one is before sinceMs → early exit
    const page2Contacts = [
      makeContact("c3", "2026-04-05T10:00:00.000Z"), // in range
      makeContact("c4", "2026-03-15T10:00:00.000Z"), // before sinceMs
    ];

    mockedAxios.get = vi.fn()
      .mockResolvedValueOnce(makePage(page1Contacts, {
        startAfter: new Date(page1Contacts[1].dateAdded).getTime(),
        startAfterId: "c2",
      }))
      .mockResolvedValueOnce(makePage(page2Contacts));

    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    // c1, c2, c3 are in range and have name+email+phone; c4 is before sinceMs
    expect(count).toBe(3);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("does not count contacts outside the upper bound (untilMs)", async () => {
    const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
    const untilMs = new Date("2026-04-30T23:59:59.999Z").getTime();

    const contacts = [
      makeContact("c1", "2026-05-01T10:00:00.000Z"), // after untilMs
      makeContact("c2", "2026-04-15T10:00:00.000Z"), // in range
      makeContact("c3", "2026-03-01T10:00:00.000Z"), // before sinceMs → triggers early exit
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce(makePage(contacts));

    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    // Only c2 is in range
    expect(count).toBe(1);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("counts leads using contactName field (not name)", async () => {
    const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
    const untilMs = new Date("2026-05-02T23:59:59.999Z").getTime();

    const contacts = [
      // Has contactName + email + phone → qualified lead
      { id: "c1", contactName: "elma", email: "elma@example.com", phone: "+13528715458", dateAdded: "2026-04-20T10:00:00.000Z" },
      // name field is undefined (as GHL returns it) — should NOT count
      { id: "c2", name: undefined, contactName: null, email: "test@example.com", phone: "+15551234567", dateAdded: "2026-04-18T10:00:00.000Z" },
      // Has firstName+lastName but no contactName → should count via fallback
      { id: "c3", contactName: null, firstName: "Jane", lastName: "Smith", email: "jane@example.com", phone: "+15559876543", dateAdded: "2026-04-15T10:00:00.000Z" },
      { id: "c4", contactName: null, firstName: null, lastName: null, email: null, phone: null, dateAdded: "2026-03-01T10:00:00.000Z" }, // before sinceMs
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce(makePage(contacts));

    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    // c1 (contactName) and c3 (firstName+lastName) qualify; c2 has no name; c4 is out of range
    expect(count).toBe(2);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("does not count contacts missing name, email, or phone", async () => {
    const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
    const untilMs = new Date("2026-05-02T23:59:59.999Z").getTime();

    const contacts = [
      makeContact("c1", "2026-04-20T10:00:00.000Z", true),  // qualified lead
      makeContact("c2", "2026-04-18T10:00:00.000Z", false), // missing fields
      makeContact("c3", "2026-04-15T10:00:00.000Z", true),  // qualified lead
      makeContact("c4", "2026-03-01T10:00:00.000Z", true),  // before sinceMs
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce(makePage(contacts));

    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(2); // only c1 and c3
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("stops when page has no cursor in meta", async () => {
    const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
    const untilMs = new Date("2026-05-02T23:59:59.999Z").getTime();

    const contacts = [
      makeContact("c1", "2026-04-20T10:00:00.000Z"),
      makeContact("c2", "2026-04-10T10:00:00.000Z"),
    ];
    // No cursor in meta → should stop after 1 page
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 2 } },
    });

    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(2);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("passes both startAfter and startAfterId cursors on subsequent pages", async () => {
    const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
    const untilMs = new Date("2026-05-02T23:59:59.999Z").getTime();

    const page1Contacts = [makeContact("c1", "2026-04-20T10:00:00.000Z")];
    const page2Contacts = [makeContact("c2", "2026-03-01T10:00:00.000Z")]; // triggers early exit

    const page1Cursor = new Date(page1Contacts[0].dateAdded).getTime();

    mockedAxios.get = vi.fn()
      .mockResolvedValueOnce({
        data: {
          contacts: page1Contacts,
          meta: { startAfter: page1Cursor, startAfterId: "c1" },
        },
      })
      .mockResolvedValueOnce({ data: { contacts: page2Contacts, meta: {} } });

    await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);

    // Verify page 2 was called with the correct cursor params
    const page2Call = (mockedAxios.get as ReturnType<typeof vi.fn>).mock.calls[1];
    const page2Params = page2Call[1].params;
    expect(page2Params.startAfter).toBe(page1Cursor);
    expect(page2Params.startAfterId).toBe("c1");
  });
});

/**
 * REGRESSION TESTS — GHL contactName field mapping
 *
 * Root cause of the 0-leads regression (fixed in commit 828a07b):
 * The GHL Contacts API v2021-07-28 returns the full contact name under
 * the field `contactName`, NOT `name`. The `name` field is `undefined`
 * for every contact returned by the API.
 *
 * The lead filter MUST use:
 *   const fullName = (c.contactName ?? `${c.firstName ?? ''} ${c.lastName ?? ''}`).trim();
 *
 * It MUST NOT use `c.name` — doing so silently rejects every contact
 * and returns 0 leads even when real leads exist.
 *
 * These tests are pinned to the exact field names returned by the live
 * GHL API (verified against Acree Tree location 3lNfVbW3dbI4YALaZjbK
 * on 2026-05-02, which returned 19 qualified leads once the fix was applied).
 */
describe("GHL contactName field — regression guard", () => {
  const sinceMs = new Date("2026-04-02T00:00:00.000Z").getTime();
  const untilMs = new Date("2026-05-02T23:59:59.999Z").getTime();
  const IN_RANGE_DATE = "2026-04-20T10:00:00.000Z";
  const OUT_OF_RANGE_DATE = "2026-03-01T10:00:00.000Z";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REGRESSION: contact with only 'name' set (undefined in real API) is NOT counted as a lead", async () => {
    // This is the exact shape the GHL API returns — 'name' is absent/undefined.
    // If the filter ever reverts to checking c.name, this test will catch it.
    const contacts = [
      {
        id: "c1",
        name: undefined,       // GHL does NOT populate this field
        contactName: null,     // also null — no name at all
        firstName: null,
        lastName: null,
        email: "test@example.com",
        phone: "+15551234567",
        dateAdded: IN_RANGE_DATE,
      },
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 1 } },
    });
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    // Must be 0 — no name means not a qualified lead
    expect(count).toBe(0);
  });

  it("REGRESSION: contact with 'name' set but 'contactName' null is NOT counted (name field is ignored)", async () => {
    // Even if someone sets c.name in a test helper, the filter must not use it.
    const contacts = [
      {
        id: "c1",
        name: "John Doe",      // present but must be ignored by the filter
        contactName: null,     // the field the filter actually checks
        firstName: null,
        lastName: null,
        email: "john@example.com",
        phone: "+15551234567",
        dateAdded: IN_RANGE_DATE,
      },
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 1 } },
    });
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    // Must be 0 — contactName is null so no qualified name exists
    expect(count).toBe(0);
  });

  it("counts a lead when contactName is a non-empty string", async () => {
    const contacts = [
      {
        id: "c1",
        name: undefined,
        contactName: "elma",   // real value from live GHL API
        firstName: null,
        lastName: null,
        email: "curryelma@yahoo.com",
        phone: "+13528715458",
        dateAdded: IN_RANGE_DATE,
      },
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 1 } },
    });
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(1);
  });

  it("counts a lead via firstName+lastName fallback when contactName is null", async () => {
    const contacts = [
      {
        id: "c1",
        name: undefined,
        contactName: null,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "+15559876543",
        dateAdded: IN_RANGE_DATE,
      },
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 1 } },
    });
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(1);
  });

  it("rejects a lead when contactName is whitespace-only", async () => {
    const contacts = [
      {
        id: "c1",
        name: undefined,
        contactName: "   ",    // whitespace only — must be trimmed and rejected
        firstName: null,
        lastName: null,
        email: "test@example.com",
        phone: "+15551234567",
        dateAdded: IN_RANGE_DATE,
      },
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 1 } },
    });
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(0);
  });

  it("rejects a lead when firstName and lastName are both whitespace-only (fallback path)", async () => {
    const contacts = [
      {
        id: "c1",
        name: undefined,
        contactName: null,
        firstName: "  ",
        lastName: "  ",
        email: "test@example.com",
        phone: "+15551234567",
        dateAdded: IN_RANGE_DATE,
      },
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 1 } },
    });
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(0);
  });

  it("correctly counts a realistic mix: 3 qualified leads out of 6 contacts", async () => {
    // Mirrors the real Acree Tree data shape from the live API probe on 2026-05-02
    const contacts = [
      // Qualified: contactName present
      { id: "c1", name: undefined, contactName: "elma", firstName: null, lastName: null, email: "curryelma@yahoo.com", phone: "+13528715458", dateAdded: IN_RANGE_DATE },
      // Qualified: firstName+lastName fallback
      { id: "c2", name: undefined, contactName: null, firstName: "Jim", lastName: "Evans", email: "cwpjimevans@yahoo.com", phone: "+13526720982", dateAdded: IN_RANGE_DATE },
      // Qualified: contactName present
      { id: "c3", name: undefined, contactName: "melissa leveque", firstName: null, lastName: null, email: "genxkid919@gmail.com", phone: "+13528717452", dateAdded: IN_RANGE_DATE },
      // Disqualified: no name at all
      { id: "c4", name: undefined, contactName: null, firstName: null, lastName: null, email: "anon@example.com", phone: "+15551111111", dateAdded: IN_RANGE_DATE },
      // Disqualified: no phone
      { id: "c5", name: undefined, contactName: "No Phone", firstName: null, lastName: null, email: "nophone@example.com", phone: null, dateAdded: IN_RANGE_DATE },
      // Out of date range — triggers early exit
      { id: "c6", name: undefined, contactName: "Old Contact", firstName: null, lastName: null, email: "old@example.com", phone: "+15559999999", dateAdded: OUT_OF_RANGE_DATE },
    ];
    mockedAxios.get = vi.fn().mockResolvedValueOnce({
      data: { contacts, meta: { total: 6 } },
    });
    const count = await fetchGhlLeadCount(LOCATION_ID, PRIVATE_TOKEN, sinceMs, untilMs);
    expect(count).toBe(3); // c1, c2, c3
  });
});
