/**
 * GoHighLevel REST API v2 — Contact fetcher.
 * Paginates until allContacts.length === meta.total.
 * Filters leads: name + email + phone all non-null/non-empty.
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
  meta: {
    total: number;
    currentPage?: number;
    nextPage?: number | null;
    startAfter?: number;
    startAfterId?: string;
  };
}

/**
 * Fetch all GHL contacts for a location within a date range.
 * Returns the count of qualified leads (name + email + phone).
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

  const allContacts: GhlContact[] = [];
  let startAfterId: string | undefined = undefined;
  let total: number | null = null;

  do {
    const params: Record<string, string | number> = {
      locationId,
      startAfter: sinceMs,
      limit: 100,
    };

    if (startAfterId) {
      params.startAfterId = startAfterId;
    }

    const resp = await axios.get<GhlContactsResponse>(`${GHL_BASE}/contacts/`, {
      headers,
      params,
    });

    const { contacts, meta } = resp.data;
    total = meta.total;
    allContacts.push(...contacts);

    // Set cursor for next page
    if (contacts.length > 0) {
      startAfterId = contacts[contacts.length - 1].id;
    } else {
      break;
    }
  } while (allContacts.length < (total ?? 0));

  // Guard — throw if count mismatch
  if (total !== null && allContacts.length !== total) {
    throw new Error(
      `GHL pagination incomplete: got ${allContacts.length}, expected ${total}`
    );
  }

  // Filter by upper date bound
  const filtered = allContacts.filter((c) => {
    const created = new Date(c.dateAdded).getTime();
    return created >= sinceMs && created <= untilMs;
  });

  // Lead definition: name + email + phone all non-null and non-empty
  const leads = filtered.filter(
    (c) =>
      c.name && c.name.trim() !== '' &&
      c.email && c.email.trim() !== '' &&
      c.phone && c.phone.trim() !== ''
  );

  return leads.length;
}
