/**
 * Settings — Token management and CPL threshold configuration.
 * Tokens are shown as last 8 chars only (masked server-side).
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function SettingField({
  label,
  description,
  currentValue,
  fieldKey,
  type = 'text',
  placeholder,
}: {
  label: string;
  description?: string;
  currentValue: string | null | undefined;
  fieldKey: string;
  type?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const utils = trpc.useUtils();

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setValue('');
      toast.success(`${label} updated`);
    },
    onError: (err) => toast.error(err.message),
  });

  const isSecret = type === 'password';

  return (
    <div className="space-y-2">
      <Label className="text-[#FAFAFA] text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-[#71717A]">{description}</p>}
      {currentValue && (
        <p className="text-xs text-[#71717A] font-mono">
          Current: <span className="text-[#FAFAFA]">{currentValue}</span>
        </p>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={isSecret && !showValue ? 'password' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder || `Enter new ${label.toLowerCase()}`}
            className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500 pr-10"
          />
          {isSecret && (
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA]"
            >
              {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        <Button
          onClick={() => {
            if (!value.trim()) return;
            updateMutation.mutate({ field: fieldKey, value: value.trim() });
          }}
          disabled={!value.trim() || updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="ml-1.5">Update</span>
        </Button>
      </div>
    </div>
  );
}

function ThresholdField({
  label,
  fieldKey,
  currentValue,
  color,
}: {
  label: string;
  fieldKey: string;
  currentValue: number | undefined;
  color: string;
}) {
  const [value, setValue] = useState('');
  const utils = trpc.useUtils();

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setValue('');
      toast.success(`${label} threshold updated`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-2">
      <Label className="text-[#FAFAFA] text-sm font-medium">
        <span className={`inline-block w-2 h-2 rounded-full mr-2`} style={{ backgroundColor: color }} />
        {label}
      </Label>
      <p className="text-xs text-[#71717A]">
        Current: <span className="text-[#FAFAFA] tabular-nums">${currentValue ?? '—'}</span>
      </p>
      <div className="flex gap-2">
        <Input
          type="number"
          min="1"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter new threshold"
          className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500 max-w-[200px] tabular-nums"
        />
        <Button
          onClick={() => {
            if (!value.trim()) return;
            updateMutation.mutate({ field: fieldKey, value: value.trim() });
          }}
          disabled={!value.trim() || updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="ml-1.5">Save</span>
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#FAFAFA]">Settings</h1>
        <p className="text-sm text-[#71717A] mt-0.5">
          Manage API tokens and CPL classification thresholds
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ir-card p-5 space-y-3">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-9 w-full bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Meta API */}
          <div className="ir-card p-5 space-y-5">
            <div className="border-b border-white/7 pb-3">
              <h2 className="text-sm font-semibold text-[#FAFAFA]">Meta Ads API</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                System User Token used for all Meta Graph API calls
              </p>
            </div>
            <SettingField
              label="Meta Access Token"
              description="Used server-side only. Never sent to the browser."
              currentValue={settings?.metaAccessToken}
              fieldKey="metaAccessToken"
              type="password"
              placeholder="Paste new token..."
            />
          </div>

          {/* GHL */}
          <div className="ir-card p-5 space-y-5">
            <div className="border-b border-white/7 pb-3">
              <h2 className="text-sm font-semibold text-[#FAFAFA]">GoHighLevel</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Agency-level token and company identifier
              </p>
            </div>
            <SettingField
              label="Agency Token"
              description="Agency-level GHL token (optional — per-client PITs are set in the Registry)."
              currentValue={settings?.ghlAgencyToken}
              fieldKey="ghlAgencyToken"
              type="password"
              placeholder="Paste agency token..."
            />
            <SettingField
              label="GHL Company ID"
              currentValue={settings?.ghlCompanyId}
              fieldKey="ghlCompanyId"
              placeholder="e.g. abc123xyz"
            />
          </div>

          {/* CPL Thresholds */}
          <div className="ir-card p-5 space-y-5">
            <div className="border-b border-white/7 pb-3">
              <h2 className="text-sm font-semibold text-[#FAFAFA]">CPL Thresholds</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                CPL below Green Max = green. Below Orange Max = orange. At or above = red.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <ThresholdField
                label="Green Max"
                fieldKey="cplGreenMax"
                currentValue={settings?.cplGreenMax}
                color="#22C55E"
              />
              <ThresholdField
                label="Orange Max"
                fieldKey="cplOrangeMax"
                currentValue={settings?.cplOrangeMax}
                color="#F97316"
              />
            </div>
            <div className="bg-[#09090B] rounded-md p-3 text-xs text-[#71717A] space-y-1">
              <p>
                <span className="text-[#22C55E] font-medium">Green</span> — CPL below $
                {settings?.cplGreenMax ?? 35}
              </p>
              <p>
                <span className="text-[#F97316] font-medium">Orange</span> — CPL between $
                {settings?.cplGreenMax ?? 35} and ${settings?.cplOrangeMax ?? 50}
              </p>
              <p>
                <span className="text-[#EF4444] font-medium">Red</span> — CPL at or above $
                {settings?.cplOrangeMax ?? 50}
              </p>
              <p>
                <span className="text-[#71717A] font-medium">Gray</span> — Zero leads
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
