/**
 * Client Registry — Add, edit, and soft-delete clients.
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ClientSlideOver, ClientFormData } from '@/components/ClientSlideOver';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientRow {
  id: number;
  name: string;
  slug: string | null;
  metaAdAccountId: string | null;
  metaPageId: string | null;
  metaPixelId: string | null;
  ghlLocationId: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Registry() {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  const { data: clients = [], isLoading } = trpc.clients.list.useQuery();

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setSlideOverOpen(false);
      toast.success('Client added successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setSlideOverOpen(false);
      setEditingClient(null);
      toast.success('Client updated successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDeletingId(null);
      toast.success('Client removed');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      if (editingClient) {
        const updatePayload: Parameters<typeof updateMutation.mutateAsync>[0] = {
          id: editingClient.id,
          name: data.name,
          slug: data.slug,
          metaAdAccountId: data.metaAdAccountId,
          metaPageId: data.metaPageId,
          metaPixelId: data.metaPixelId,
          ghlLocationId: data.ghlLocationId,
          notes: data.notes,
        };
        if (data.ghlPrivateToken && data.ghlPrivateToken.trim() !== '') {
          updatePayload.ghlPrivateToken = data.ghlPrivateToken;
        }
        await updateMutation.mutateAsync(updatePayload);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: ClientRow) => {
    setEditingClient(client);
    setSlideOverOpen(true);
  };

  // Helper to convert ClientRow to form-compatible shape
  function toFormData(client: ClientRow): Partial<ClientFormData> & { id: number } {
    return {
      id: client.id,
      name: client.name,
      slug: client.slug ?? undefined,
      metaAdAccountId: client.metaAdAccountId ?? undefined,
      metaPageId: client.metaPageId ?? undefined,
      metaPixelId: client.metaPixelId ?? undefined,
      ghlLocationId: client.ghlLocationId ?? undefined,
      notes: client.notes ?? undefined,
    };
  }

  const handleAddNew = () => {
    setEditingClient(null);
    setSlideOverOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#FAFAFA]">Client Registry</h1>
          <p className="text-sm text-[#71717A] mt-0.5">
            Manage client credentials and API connections
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Table */}
      <div className="ir-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/7">
                <th className="text-left px-4 py-3 text-[#71717A] font-medium">Client Name</th>
                <th className="text-left px-4 py-3 text-[#71717A] font-medium">Meta Ad Account</th>
                <th className="text-left px-4 py-3 text-[#71717A] font-medium">GHL Location</th>
                <th className="text-left px-4 py-3 text-[#71717A] font-medium">Notes</th>
                <th className="text-right px-4 py-3 text-[#71717A] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40 bg-white/10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28 bg-white/10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28 bg-white/10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32 bg-white/10" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="h-7 w-16 ml-auto bg-white/10" /></td>
                    </tr>
                  ))
                : clients.length === 0
                ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-[#71717A]">
                        No clients yet. Click "Add Client" to get started.
                      </td>
                    </tr>
                  )
                : clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#FAFAFA]">{client.name}</td>
                      <td className="px-4 py-3 text-[#71717A] font-mono text-xs">
                        {client.metaAdAccountId || <span className="text-white/20">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[#71717A] font-mono text-xs">
                        {client.ghlLocationId || <span className="text-white/20">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[#71717A] text-xs max-w-xs truncate">
                        {client.notes || <span className="text-white/20">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            className="h-7 w-7 p-0 text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(client.id)}
                            className="h-7 w-7 p-0 text-[#71717A] hover:text-[#EF4444] hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over */}
      <ClientSlideOver
        open={slideOverOpen}
        onClose={() => {
          setSlideOverOpen(false);
          setEditingClient(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingClient ? toFormData(editingClient) : undefined}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent className="bg-[#111113] border-white/10 text-[#FAFAFA]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FAFAFA]">Remove Client</AlertDialogTitle>
            <AlertDialogDescription className="text-[#71717A]">
              This will deactivate the client and remove them from the dashboard. This action can be
              reversed by re-enabling the client directly in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-[#FAFAFA] hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
              className="bg-[#EF4444] hover:bg-red-600 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
