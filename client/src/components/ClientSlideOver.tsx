/**
 * ClientSlideOver — Slide-over panel for adding/editing clients.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface ClientFormData {
  name: string;
  slug?: string;
  metaAdAccountId?: string;
  metaPageId?: string;
  metaPixelId?: string;
  ghlLocationId?: string;
  ghlPrivateToken?: string;
  notes?: string;
}

interface ClientSlideOverProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<ClientFormData> & { id?: number };
  isSubmitting?: boolean;
}

export function ClientSlideOver({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: ClientSlideOverProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>();

  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name ?? '',
        slug: initialData?.slug ?? '',
        metaAdAccountId: initialData?.metaAdAccountId ?? '',
        metaPageId: initialData?.metaPageId ?? '',
        metaPixelId: initialData?.metaPixelId ?? '',
        ghlLocationId: initialData?.ghlLocationId ?? '',
        ghlPrivateToken: '',
        notes: initialData?.notes ?? '',
      });
    }
  }, [open, initialData, reset]);

  const isEdit = !!initialData?.id;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-[#111113] border-l border-white/7 text-[#FAFAFA] overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[#FAFAFA]">
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </SheetTitle>
          <SheetDescription className="text-[#71717A]">
            {isEdit
              ? 'Update client credentials and settings.'
              : 'Fill in the client details. Only Name is required.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[#FAFAFA] text-sm">
              Client Name <span className="text-[#EF4444]">*</span>
            </Label>
            <Input
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g. Smith Tree Service"
              className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500"
            />
            {errors.name && (
              <p className="text-xs text-[#EF4444]">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label className="text-[#71717A] text-sm">Slug</Label>
            <Input
              {...register('slug')}
              placeholder="e.g. smith-tree"
              className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500"
            />
          </div>

          {/* Meta section */}
          <div className="border-t border-white/7 pt-4">
            <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-3">
              Meta Ads
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[#71717A] text-sm">Ad Account ID</Label>
                <Input
                  {...register('metaAdAccountId')}
                  placeholder="e.g. 123456789"
                  className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#71717A] text-sm">Page ID</Label>
                <Input
                  {...register('metaPageId')}
                  placeholder="e.g. 987654321"
                  className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#71717A] text-sm">Pixel ID</Label>
                <Input
                  {...register('metaPixelId')}
                  placeholder="e.g. 111222333"
                  className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* GHL section */}
          <div className="border-t border-white/7 pt-4">
            <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-3">
              GoHighLevel
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[#71717A] text-sm">Location ID</Label>
                <Input
                  {...register('ghlLocationId')}
                  placeholder="e.g. abc123xyz"
                  className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#71717A] text-sm">
                  Private Integration Token (PIT)
                  {isEdit && (
                    <span className="ml-1 text-[#71717A] font-normal">(leave blank to keep existing)</span>
                  )}
                </Label>
                <Input
                  {...register('ghlPrivateToken')}
                  type="password"
                  placeholder={isEdit ? '••••••••••••' : 'Enter PIT token'}
                  className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[#71717A] text-sm">Notes</Label>
            <Textarea
              {...register('notes')}
              placeholder="Optional notes..."
              rows={3}
              className="bg-[#09090B] border-white/10 text-[#FAFAFA] placeholder:text-[#71717A] focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Client'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-white/10 text-[#FAFAFA] hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
