/**
 * ClientTable — Overview table showing all clients with CPL data.
 * Sorted by CPL descending (worst first) by default.
 * Shows skeleton rows while loading.
 */
import { CplBadge } from './CplBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface ClientInsight {
  clientId: number;
  clientName: string;
  spend: number;
  leads: number;
  cpl: number | null;
  cplColor: 'green' | 'orange' | 'red' | 'gray';
  ctr: number;
  impressions: number;
  dateRange: string;
  error?: string;
}

interface ClientTableProps {
  data: ClientInsight[];
  isLoading: boolean;
  fromCache?: boolean;
  cachedAt?: Date;
}

function fmt$(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(n: number) {
  return n.toLocaleString('en-US');
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}

const SKELETON_ROWS = 8;

export function ClientTable({ data, isLoading, fromCache, cachedAt }: ClientTableProps) {
  return (
    <div className="ir-card overflow-hidden">
      {/* Cache indicator */}
      {!isLoading && fromCache !== undefined && (
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 text-xs text-[#71717A]">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${fromCache ? 'bg-blue-400' : 'bg-green-400'}`}
          />
          {fromCache
            ? `Cached ${cachedAt ? new Date(cachedAt).toLocaleTimeString() : ''} — click Refresh to fetch live data`
            : `Live data fetched ${cachedAt ? new Date(cachedAt).toLocaleTimeString() : ''}`}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/7">
              <th className="text-left px-4 py-3 text-[#71717A] font-medium">Client</th>
              <th className="text-right px-4 py-3 text-[#71717A] font-medium tabular-nums">Spend</th>
              <th className="text-right px-4 py-3 text-[#71717A] font-medium tabular-nums">Leads</th>
              <th className="text-right px-4 py-3 text-[#71717A] font-medium">CPL</th>
              <th className="text-right px-4 py-3 text-[#71717A] font-medium tabular-nums">CTR</th>
              <th className="text-right px-4 py-3 text-[#71717A] font-medium tabular-nums">Impressions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-40 bg-white/10" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="h-4 w-20 ml-auto bg-white/10" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="h-4 w-10 ml-auto bg-white/10" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="h-5 w-16 ml-auto rounded-full bg-white/10" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="h-4 w-12 ml-auto bg-white/10" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="h-4 w-20 ml-auto bg-white/10" />
                    </td>
                  </tr>
                ))
              : data.length === 0
              ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#71717A]">
                      No clients found. Add clients in the Registry.
                    </td>
                  </tr>
                )
              : data.map((row) => (
                  <tr
                    key={row.clientId}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#FAFAFA]">
                      <div className="flex items-center gap-2">
                        {row.clientName}
                        {row.error && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="w-3.5 h-3.5 text-[#F97316]" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#111113] border-white/10 text-[#FAFAFA] max-w-xs">
                              <p className="text-xs">{row.error}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#FAFAFA]">
                      {fmt$(row.spend)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#FAFAFA]">
                      {fmtNum(row.leads)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CplBadge cpl={row.cpl} color={row.cplColor} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#FAFAFA]">
                      {fmtPct(row.ctr)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#FAFAFA]">
                      {fmtNum(row.impressions)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
