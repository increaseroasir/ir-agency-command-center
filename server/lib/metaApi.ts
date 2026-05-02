/**
 * Meta Graph API v25.0 — Insights fetcher.
 * Always fetches at ad account level with level=campaign.
 * Handles pagination via paging.next cursor.
 */
import axios from 'axios';

const META_API_BASE = 'https://graph.facebook.com/v25.0';

export interface MetaCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  ctr: string;
}

export interface MetaInsightsResult {
  totalSpend: number;
  totalImpressions: number;
  weightedCtr: number;
}

interface MetaInsightsResponse {
  data: MetaCampaignInsight[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
}

/**
 * Fetch all campaign insights for a given ad account.
 * Supports both datePreset and custom since/until ranges.
 */
export async function fetchMetaInsights(
  metaAdAccountId: string,
  accessToken: string,
  options: { datePreset?: string; since?: string; until?: string }
): Promise<MetaInsightsResult> {
  const accountId = `act_${metaAdAccountId}`;
  const url = `${META_API_BASE}/${accountId}/insights`;

  const params: Record<string, string> = {
    fields: 'campaign_id,campaign_name,spend,impressions,ctr',
    level: 'campaign',
    time_increment: '1',
    access_token: accessToken,
    limit: '500',
  };

  if (options.datePreset) {
    params.date_preset = options.datePreset;
  } else if (options.since && options.until) {
    params.time_range = JSON.stringify({ since: options.since, until: options.until });
  }

  const allData: MetaCampaignInsight[] = [];
  let nextUrl: string | undefined = undefined;

  // First page
  const firstResp = await axios.get<MetaInsightsResponse>(url, { params });
  allData.push(...(firstResp.data.data || []));
  nextUrl = firstResp.data.paging?.next;

  // Paginate via paging.next cursor
  while (nextUrl) {
    const pageResp = await axios.get<MetaInsightsResponse>(nextUrl);
    allData.push(...(pageResp.data.data || []));
    nextUrl = pageResp.data.paging?.next;
  }

  if (allData.length === 0) {
    return { totalSpend: 0, totalImpressions: 0, weightedCtr: 0 };
  }

  const totalSpend = allData.reduce((sum, c) => sum + parseFloat(c.spend || '0'), 0);
  const totalImpressions = allData.reduce((sum, c) => sum + parseInt(c.impressions || '0', 10), 0);

  // Weighted average CTR by impressions
  const weightedCtr =
    totalImpressions > 0
      ? allData.reduce((sum, c) => {
          const imp = parseInt(c.impressions || '0', 10);
          const ctr = parseFloat(c.ctr || '0');
          return sum + ctr * imp;
        }, 0) / totalImpressions
      : 0;

  return { totalSpend, totalImpressions, weightedCtr };
}
