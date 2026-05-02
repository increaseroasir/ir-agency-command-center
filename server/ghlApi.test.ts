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

// Helper to build a mock contact
function makeContact(id: string, dateAdded: string, hasAll = true) {
  return {
    id,
    name: hasAll ? "John Doe" : null,
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
