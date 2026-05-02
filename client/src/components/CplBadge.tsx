/**
 * CplBadge — Color-coded CPL pill component.
 * Colors: green < cplGreenMax, orange < cplOrangeMax, red >= cplOrangeMax, gray = no leads.
 */

type CplColor = 'green' | 'orange' | 'red' | 'gray';

interface CplBadgeProps {
  cpl: number | null;
  color: CplColor;
}

const colorClasses: Record<CplColor, string> = {
  green: 'cpl-green',
  orange: 'cpl-orange',
  red: 'cpl-red',
  gray: 'cpl-gray',
};

export function CplBadge({ cpl, color }: CplBadgeProps) {
  const label =
    cpl === null
      ? 'No Leads'
      : `$${cpl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${colorClasses[color]}`}
    >
      {label}
    </span>
  );
}
