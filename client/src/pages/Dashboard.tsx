/**
 * Overview Dashboard — Main page showing all clients with live CPL data.
 * Supports 5 date presets including Custom (since/until).
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ClientTable } from '@/components/ClientTable';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, TrendingDown, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [datePreset, setDatePreset] = useState('last_30d');
  const [bust, setBust] = useState(false);
  const [customSince, setCustomSince] = useState('');
  const [customUntil, setCustomUntil] = useState('');

  const isCustom = datePreset === 'custom';

  // Compute query params
  const queryParams = isCustom && customSince && customUntil
    ? {
        since: new Date(customSince).getTime(),
        until: new Date(customUntil + 'T23:59:59').getTime(),
        bust,
      }
    : isCustom
    ? null // Don't query until both dates are set
    : { datePreset, bust };

  const { data, isLoading, refetch, isFetching } = trpc.insights.get.useQuery(
    queryParams ?? { datePreset: 'last_30d', bust: false },
    {
      enabled: queryParams !== null,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );

  const handleRefresh = async () => {
    setBust(true);
    await refetch();
    setBust(false);
    toast.success('Data refreshed from live sources');
  };

  const handlePresetChange = (value: string) => {
    setBust(false);
    setDatePreset(value);
  };

  const insights = data?.data ?? [];

  // Summary stats
  const totalSpend = insights.reduce((s, r) => s + r.spend, 0);
  const totalLeads = insights.reduce((s, r) => s + r.leads, 0);
  const overallCpl = totalLeads > 0 ? totalSpend / totalLeads : null;
  const greenCount = insights.filter((r) => r.cplColor === 'green').length;
  const redCount = insights.filter((r) => r.cplColor === 'red').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#FAFAFA]">Overview</h1>
          <p className="text-sm text-[#71717A] mt-0.5">
            {insights.length > 0
              ? `${insights.length} active clients`
              : 'Live CPL dashboard'}
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <DateRangeSelector
            value={datePreset}
            onChange={handlePresetChange}
            disabled={isFetching}
          />
          {isCustom && (
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-[#71717A]">From</Label>
                <Input
                  type="date"
                  value={customSince}
                  onChange={(e) => setCustomSince(e.target.value)}
                  className="bg-[#111113] border-white/10 text-[#FAFAFA] w-36 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#71717A]">To</Label>
                <Input
                  type="date"
                  value={customUntil}
                  onChange={(e) => setCustomUntil(e.target.value)}
                  className="bg-[#111113] border-white/10 text-[#FAFAFA] w-36 text-sm"
                />
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching || (isCustom && (!customSince || !customUntil))}
            className="border-white/10 text-[#FAFAFA] hover:bg-white/5 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {!isLoading && insights.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ir-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-[#71717A]" />
              <span className="text-xs text-[#71717A] uppercase tracking-wider">Total Spend</span>
            </div>
            <p className="text-xl font-semibold tabular-nums text-[#FAFAFA]">
              ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="ir-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#71717A]" />
              <span className="text-xs text-[#71717A] uppercase tracking-wider">Total Leads</span>
            </div>
            <p className="text-xl font-semibold tabular-nums text-[#FAFAFA]">
              {totalLeads.toLocaleString('en-US')}
            </p>
          </div>
          <div className="ir-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-[#71717A]" />
              <span className="text-xs text-[#71717A] uppercase tracking-wider">Avg CPL</span>
            </div>
            <p className="text-xl font-semibold tabular-nums text-[#FAFAFA]">
              {overallCpl !== null
                ? `$${overallCpl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </p>
          </div>
          <div className="ir-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="text-xs text-[#71717A] uppercase tracking-wider">Green / Red</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">
              <span className="text-[#22C55E]">{greenCount}</span>
              <span className="text-[#71717A] mx-1">/</span>
              <span className="text-[#EF4444]">{redCount}</span>
            </p>
          </div>
        </div>
      )}

      {/* Custom range — waiting for input */}
      {isCustom && (!customSince || !customUntil) && (
        <div className="ir-card p-8 text-center text-[#71717A]">
          Select a start and end date above to load data for a custom range.
        </div>
      )}

      {/* Main table */}
      {(!isCustom || (customSince && customUntil)) && (
        <ClientTable
          data={insights}
          isLoading={isLoading || isFetching}
          fromCache={data?.fromCache}
          cachedAt={data?.cachedAt ? new Date(data.cachedAt) : undefined}
        />
      )}
    </div>
  );
}
