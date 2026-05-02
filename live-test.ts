import { fetchMetaInsights } from './server/lib/metaApi';
import { fetchGhlLeadCount } from './server/lib/ghlApi';
import { resolveDateRange } from './server/lib/dateUtils';

async function main() {
  const range = resolveDateRange('last_30d');
  console.log('Date range:', range.sinceStr, '->', range.untilStr);

  console.log('\n--- META ---');
  try {
    const metaToken = process.env.META_TOKEN!;
    const adAccountId = '916925733568706';
    const result = await fetchMetaInsights(adAccountId, metaToken, {
      since: range.sinceStr,
      until: range.untilStr,
    });
    console.log('Meta totalSpend:', result.totalSpend);
    console.log('Meta totalImpressions:', result.totalImpressions);
    console.log('Meta weightedCtr:', result.weightedCtr.toFixed(4));
  } catch (e: any) {
    console.error('Meta error:', e.response?.data || e.message);
  }

  console.log('\n--- GHL ---');
  try {
    const ghlToken = 'pit-ec10e47c-e1a4-4731-b930-1da86723fbd6';
    const locationId = '3lNfVbW3dbI4YALaZjbK';
    const leads = await fetchGhlLeadCount(locationId, ghlToken, range.sinceMs, range.untilMs);
    console.log('GHL qualified leads:', leads);
  } catch (e: any) {
    console.error('GHL error:', e.response?.data || e.message);
  }
}

main();
