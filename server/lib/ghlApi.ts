/**
 * GoHighLevel REST API v2 — Contact fetcher.
 *
 * Pagination strategy:
 * - Contacts are returned newest-first.
 * - The meta.startAfter cursor is the dateAdded Unix ms of the last contact on the page.
 * - The meta.startAfterId cursor is the id of the last contact on the page.
 * - Both cursors must be passed together for the next page.
 * - Stop early when the last contact on a page has dateAdded < sinceMs (no more in-range contacts).
 * - Also stop when a page returns 0 contacts.
 * - Never compare allContacts.length against meta.total — that field is unreliable.
 *
 * GHL has no server-side date filter (startAfterDate returns 422; startAfter is cursor-only).
 * We apply the date range filter client-side after collecting all in-range contacts.
 *
 * Lead definition: contact where name, email, AND phone are all non-empty strings after trim.
 */
import axios from 'axios';

const GHL_BASE = 'https://services.leadconnectorhq.com';

export interface GhlContact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dateAdded: string;
}

interface GhlContactsResponse {
  contacts: GhlContact[];
  meta?: {
    total?: number;
    currentPage?: number;
    nextPage?: number | null;
    startAfter?: number;      // dateAdded Unix ms of last contact on this page (pagination cursor)
    startAfterId?: string;    // id of last contact on this page (pagination cursor)
  };
}

/**
 * Fetch GHL contacts for a location within a date range.
 * Uses early-exit pagination: stops as soon as contacts fall before sinceMs.
 * Returns the count of qualified leads (name + email + phone all non-empty).
 */
export async function fetchGhlLeadCount(
  locationId: string,
  privateToken: string,
  sinceMs: number,
  untilMs: number
): Promise<number> {
  const headers = {
    Authorization: `Bearer ${privateToken}`,
    Version: '2021-07-28',
  };

  const inRangeContacts: GhlContact[] = [];
  let cursorMs: number | undefined = undefined;
  let cursorId: string | undefined = undefined;
  let pageCount = 0;

  // Paginate newest-first, stop early when we pass sinceMs
  while (true) {
    pageCount++;
    const params: Record<string, string | number> = {
      locationId,
      limit: 100,
    };

    // Pass both cursor values for pages after the first
    if (cursorMs !== undefined) {
      params.startAfter = cursorMs;
    }
    if (cursorId !== undefined) {
      params.startAfterId = cursorId;
    }

    const resp = await axios.get<GhlContactsResponse>(`${GHL_BASE}/contacts/`, {
      headers,
      params,
    });

    const contacts: GhlContact[] = resp.data?.contacts ?? [];

    // Stop when the page returns no contacts
    if (contacts.length === 0) {
      break;
    }

    // Collect contacts that fall within the date range
    for (const c of contacts) {
      const created = new Date(c.dateAdded).getTime();
      if (created >= sinceMs && created <= untilMs) {
        inRangeContacts.push(c);
      }
    }

    // Early exit: contacts are newest-first, so once the last contact on this page
    // is before sinceMs, all subsequent pages will also be before sinceMs.
    const lastContact = contacts[contacts.length - 1];
    const lastCreated = new Date(lastContact.dateAdded).getTime();
    if (lastCreated < sinceMs) {
      break;
    }

    // Advance cursor using meta values from this page
    const meta = resp.data?.meta;
    if (meta?.startAfter !== undefined && meta?.startAfterId) {
      cursorMs = meta.startAfter;
      cursorId = meta.startAfterId;
    } else {
      // No cursor available — stop to avoid infinite loop
      break;
    }
  }

  // Lead definition: name + email + phone all non-null and non-empty after trim
  const leads = inRangeContacts.filter(
    (c) =>
      c.name && c.name.trim() !== '' &&
      c.email && c.email.trim() !== '' &&
      c.phone && c.phone.trim() !== ''
  );

  return leads.length;
}
