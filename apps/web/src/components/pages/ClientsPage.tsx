import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users, Search, Plus, X, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, UserCircle, Trash2, Mail,
  Phone, Edit2, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  email?: string | null;
  mobilePhone?: string | null;
  idNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
}

interface PagedClients {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateClientSchema = z.object({
  firstName:   z.string().min(1, 'Required').max(100),
  lastName:    z.string().min(1, 'Required').max(100),
  email:       z.string().email('Invalid email').optional().or(z.literal('')),
  mobilePhone: z.string().max(20).optional().or(z.literal('')),
  idNumber:    z.string().max(13).optional().or(z.literal('')),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional().or(z.literal('')),
});
type CreateClientForm = z.infer<typeof CreateClientSchema>;

// ── Glass field helpers ────────────────────────────────────────────────────────

const fieldStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
};

function GlassInput({
  error, className, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        'w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25',
        'focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50',
        className,
      )}
      style={error ? { ...fieldStyle, border: '1px solid rgba(248,113,113,0.4)' } : fieldStyle}
      {...props}
    />
  );
}

// ── Drawer — Create Client ────────────────────────────────────────────────────

function CreateClientDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateClientForm>({
    resolver: zodResolver(CreateClientSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: CreateClientForm) => {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
      );
      return api.post('/clients', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      reset();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto p-6"
        style={{
          background: 'rgba(15,12,30,0.96)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '-32px 0 80px rgba(0,0,0,0.5)',
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">New client</h2>
            <p className="text-xs text-white/40 mt-0.5">Add a client to your portfolio</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mutation.isError && (
          <div
            className="mb-4 flex items-start gap-2 rounded-xl p-3 text-sm"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span className="text-red-300">Could not create client. Please try again.</span>
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">First name *</label>
              <GlassInput placeholder="John" error={!!errors.firstName} {...register('firstName')} />
              {errors.firstName && <p className="mt-1 text-[11px] text-red-400">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Last name *</label>
              <GlassInput placeholder="Smith" error={!!errors.lastName} {...register('lastName')} />
              {errors.lastName && <p className="mt-1 text-[11px] text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <GlassInput type="email" placeholder="john@example.co.za" error={!!errors.email} {...register('email')} />
            {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Mobile</label>
            <GlassInput type="tel" placeholder="0821234567" {...register('mobilePhone')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">SA ID number</label>
              <GlassInput placeholder="0001015009087" maxLength={13} {...register('idNumber')} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Date of birth</label>
              <GlassInput type="date" placeholder="YYYY-MM-DD" error={!!errors.dateOfBirth} {...register('dateOfBirth')} />
              {errors.dateOfBirth && <p className="mt-1 text-[11px] text-red-400">{errors.dateOfBirth.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
              style={fieldStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                boxShadow: '0 0 16px rgba(124,58,237,0.35)',
              }}
            >
              {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save client</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Client row ────────────────────────────────────────────────────────────────

function ClientRow({ client, onDelete }: { client: Client; onDelete: (id: string) => void }) {
  return (
    <div
      className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-all"
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
      >
        {client.firstName[0]}{client.lastName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {client.firstName} {client.lastName}
          {client.preferredName && (
            <span className="ml-1.5 text-xs text-white/40">({client.preferredName})</span>
          )}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {client.email && (
            <span className="flex items-center gap-1 text-[11px] text-white/40 truncate">
              <Mail className="h-3 w-3 shrink-0" />{client.email}
            </span>
          )}
          {client.mobilePhone && (
            <span className="flex items-center gap-1 text-[11px] text-white/40">
              <Phone className="h-3 w-3 shrink-0" />{client.mobilePhone}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          title="Edit (coming soon)"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded-lg p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete"
          onClick={() => onDelete(client.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClientsPage() {
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]         = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryClient = useQueryClient();

  // Debounce search input
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout((window as any).__clientSearchTimer);
    (window as any).__clientSearchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 350);
  }, []);

  const { data, isLoading, isError } = useQuery<PagedClients>({
    queryKey: ['clients', debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get<{ data: PagedClients }>(`/clients?${params}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-[-0.02em] flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" /> Clients
          </h1>
          <p className="mt-0.5 text-sm text-white/40">
            {data ? `${data.total.toLocaleString()} client${data.total !== 1 ? 's' : ''}` : 'Manage your client portfolio'}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            boxShadow: '0 0 16px rgba(124,58,237,0.35)',
          }}
        >
          <Plus className="h-4 w-4" /> Add client
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email or ID number…"
          className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:ring-2 focus:ring-violet-500/30"
          style={fieldStyle}
        />
      </div>

      {/* List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-white/60">Failed to load clients.</p>
          </div>
        )}

        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <UserCircle className="h-12 w-12 text-white/15" />
            <div className="text-center">
              <p className="text-sm font-medium text-white/60">
                {debouncedSearch ? 'No clients match your search' : 'No clients yet'}
              </p>
              {!debouncedSearch && (
                <p className="mt-1 text-xs text-white/30">Click "Add client" to get started</p>
              )}
            </div>
          </div>
        )}

        {!isLoading && data && data.items.length > 0 && (
          <div className="divide-y divide-white/5 px-4 pb-4 pt-3 space-y-1.5">
            {data.items.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onDelete={(id) => {
                  if (confirm(`Delete ${client.firstName} ${client.lastName}? This cannot be undone.`)) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white/60 hover:text-white disabled:opacity-30 transition-all"
            style={fieldStyle}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="text-xs text-white/40">
            Page {page} of {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page >= data.pages}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white/60 hover:text-white disabled:opacity-30 transition-all"
            style={fieldStyle}
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Create drawer */}
      <CreateClientDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
