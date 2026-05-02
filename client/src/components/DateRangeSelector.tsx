/**
 * DateRangeSelector — 5 preset date range picker.
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DATE_PRESETS = [
  { label: 'Last 7 Days', value: 'last_7d' },
  { label: 'Last 30 Days', value: 'last_30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Custom Range', value: 'custom' },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]['value'];

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DateRangeSelector({ value, onChange, disabled }: DateRangeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="w-[180px] bg-[#111113] border-white/10 text-[#FAFAFA] focus:ring-blue-500"
      >
        <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      <SelectContent className="bg-[#111113] border-white/10 text-[#FAFAFA]">
        {DATE_PRESETS.map((preset) => (
          <SelectItem
            key={preset.value}
            value={preset.value}
            className="focus:bg-white/10 focus:text-white"
          >
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
