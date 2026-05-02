/**
 * Date range utilities for Meta API and GHL API calls.
 * Converts datePreset values to Unix ms timestamps for GHL.
 */

export interface DateRange {
  sinceMs: number;
  untilMs: number;
  sinceStr: string; // YYYY-MM-DD
  untilStr: string; // YYYY-MM-DD
}

function toYMD(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Convert a datePreset string or custom since/until ms timestamps
 * into a unified DateRange object.
 */
export function resolveDateRange(
  datePreset?: string,
  sinceMs?: number,
  untilMs?: number
): DateRange {
  const now = new Date();

  if (sinceMs && untilMs) {
    return {
      sinceMs,
      untilMs,
      sinceStr: toYMD(new Date(sinceMs)),
      untilStr: toYMD(new Date(untilMs)),
    };
  }

  const preset = datePreset || 'last_30d';
  const until = new Date(now);
  until.setHours(23, 59, 59, 999);
  const since = new Date(now);

  switch (preset) {
    case 'last_7d':
      since.setDate(since.getDate() - 6);
      break;
    case 'last_30d':
      since.setDate(since.getDate() - 29);
      break;
    case 'this_month':
      since.setDate(1);
      break;
    case 'last_month': {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 1);
      const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1);
      since.setTime(firstOfLastMonth.getTime());
      until.setTime(lastOfLastMonth.getTime());
      break;
    }
    default:
      since.setDate(since.getDate() - 29);
  }

  since.setHours(0, 0, 0, 0);

  return {
    sinceMs: since.getTime(),
    untilMs: until.getTime(),
    sinceStr: toYMD(since),
    untilStr: toYMD(until),
  };
}
