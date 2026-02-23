import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Target, Plus, Search, X, Loader2, AlertCircle, Check,
  Mail, Phone, Building2, Calendar, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'fna_scheduled'
  | 'quoted' | 'proposal_submitted' | 'awaiting_decision'
  | 'won' | 'lost';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  productInterests?: string[];
  nextFollowUpAt?: string | null;
  createdAt: string;
}

interface KanbanColumn {
  status: LeadStatus;
  items: Lead[];
  total: number;
}

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: {
  status: LeadStatus;
  label: string;
  color: string;
  glow: string;
  dot: string;
}[] = [
  { status: 'new',                 label: 'New',               color: 'rgba(99,102,241,0.15)',  glow: 'rgba(99,102,241,0.3)',  dot: '#6366f1' },
  { status: 'contacted',           label: 'Contacted',         color: 'rgba(59,130,246,0.15)',  glow: 'rgba(59,130,246,0.3)',  dot: '#3b82f6' },
  { status: 'qualified',           label: 'Qualified',         color: 'rgba(124,58,237,0.15)',  glow: 'rgba(124,58,237,0.3)',  dot: '#7c3aed' },
  { status: 'fna_scheduled',       label: 'FNA Scheduled',     color: 'rgba(168,85,247,0.15)',  glow: 'rgba(168,85,247,0.3)',  dot: '#a855f7' },
  { status: 'quoted',              label: 'Quoted',            color: 'rgba(245,158,11,0.12)',  glow: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  { status: 'proposal_submitted',  label: 'Proposal Sent',     color: 'rgba(249,115,22,0.12)',  glow: 'rgba(249,115,22,0.3)',  dot: '#f97316' },
  { status: 'awaiting_decision',   label: 'Awaiting Decision', color: 'rgba(234,179,8,0.12)',   glow: 'rgba(234,179,8,0.3)',   dot: '#eab308' },
  { status: 'won',                 label: 'Won',               color: 'rgba(16,185,129,0.12)',  glow: 'rgba(16,185,129,0.3)',  dot: '#10b981' },
  { status: 'lost',                label: 'Lost',              color: 'rgba(239,68,68,0.10)',   glow: 'rgba(239,68,68,0.3)',   dot: '#ef4444' },
];

const SOURCE_LABELS: Record<string, string> = {
  referral: 'Referral', cold_call: 'Cold Call', networking: 'Networking',
  social_media: 'Social', insurer_lead: 'Insurer', aggregator: 'Aggregator',
  walk_in: 'Walk-in', bancassurance: 'Banca', website: 'Website',
  existing_client: 'Existing Client', other: 'Other',
};

// ── Glass field helpers ────────────────────────────────────────────────────────

const glassFieldStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
};

function GlassInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:ring-2 focus:ring-violet-500/30"
      style={error ? { ...glassFieldStyle, border: '1px solid rgba(248,113,113,0.4)' } : glassFieldStyle}
      {...props}
    />
  );
}

function GlassSelect({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all cursor-pointer focus:ring-2 focus:ring-violet-500/30"
      style={error ? { ...glassFieldStyle, border: '1px solid rgba(248,113,113,0.4)' } : glassFieldStyle}
      {...props}
    >
      {children}
    </select>
  );
}

// ── Create Lead Drawer ─────────────────────────────────────────────────────────

const CreateLeadSchema = z.object({
  firstName:   z.string().min(1, 'Required').max(100),
  lastName:    z.string().min(1, 'Required').max(100),
  email:       z.string().email('Invalid email').optional().or(z.literal('')),
  phone:       z.string().max(20).optional().or(z.literal('')),
  company:     z.string().max(200).optional().or(z.literal('')),
  source:      z.string().optional(),
  nextFollowUpAt: z.string().optional(),
});
type CreateLeadForm = z.infer<typeof CreateLeadSchema>;

function CreateLeadDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateLeadForm>({
    resolver: zodResolver(CreateLeadSchema),
    defaultValues: { source: 'other' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateLeadForm) => {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
      );
      return api.post('/leads', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
      reset();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto p-6"
        style={{
          background: 'rgba(15,12,30,0.96)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '-32px 0 80px rgba(0,0,0,0.5)',
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">New lead</h2>
            <p className="text-xs text-white/40 mt-0.5">Add to your pipeline</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mutation.isError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span className="text-red-300">Could not create lead.</span>
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">First name *</label>
              <GlassInput placeholder="Jane" error={!!errors.firstName} {...register('firstName')} />
              {errors.firstName && <p className="mt-1 text-[11px] text-red-400">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Last name *</label>
              <GlassInput placeholder="Doe" error={!!errors.lastName} {...register('lastName')} />
              {errors.lastName && <p className="mt-1 text-[11px] text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <GlassInput type="email" placeholder="jane@example.co.za" {...register('email')} />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Mobile</label>
            <GlassInput type="tel" placeholder="0821234567" {...register('phone')} />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Company</label>
            <GlassInput placeholder="Company name (optional)" {...register('company')} />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Lead source</label>
            <GlassSelect {...register('source')}>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <option key={v} value={v} style={{ background: '#1e1b2e' }}>{l}</option>
              ))}
            </GlassSelect>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Next follow-up (optional)</label>
            <GlassInput type="datetime-local" {...register('nextFollowUpAt')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white/60 hover:text-white" style={glassFieldStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}
            >
              {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Add lead</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Lead card ──────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onDragStart,
}: {
  lead: Lead;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const followUp = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt) : null;
  const isOverdue = followUp ? followUp < new Date() : false;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="group cursor-grab active:cursor-grabbing rounded-xl p-3 transition-all select-none hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {lead.firstName} {lead.lastName}
          </p>
          {lead.company && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/40">
              <Building2 className="h-2.5 w-2.5 shrink-0" />{lead.company}
            </p>
          )}
        </div>
        {lead.source && (
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/60"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {lead.email && (
          <span className="flex items-center gap-1.5 truncate text-[11px] text-white/35">
            <Mail className="h-2.5 w-2.5 shrink-0" />{lead.email}
          </span>
        )}
        {lead.phone && (
          <span className="flex items-center gap-1.5 text-[11px] text-white/35">
            <Phone className="h-2.5 w-2.5 shrink-0" />{lead.phone}
          </span>
        )}
      </div>

      {lead.productInterests && lead.productInterests.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.productInterests.slice(0, 3).map((p) => (
            <span
              key={p}
              className="rounded-md px-1.5 py-0.5 text-[10px] text-violet-300"
              style={{ background: 'rgba(124,58,237,0.15)' }}
            >
              {p.replace(/_/g, ' ')}
            </span>
          ))}
          {lead.productInterests.length > 3 && (
            <span className="text-[10px] text-white/30">+{lead.productInterests.length - 3}</span>
          )}
        </div>
      )}

      {followUp && (
        <div className={cn(
          'mt-2 flex items-center gap-1.5 text-[11px]',
          isOverdue ? 'text-red-400' : 'text-amber-400/70',
        )}>
          <Calendar className="h-2.5 w-2.5 shrink-0" />
          {isOverdue ? 'Overdue: ' : 'Follow-up: '}
          {followUp.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
        </div>
      )}
    </div>
  );
}

// ── Kanban column ──────────────────────────────────────────────────────────────

function KanbanCol({
  col,
  config,
  onDragStart,
  onDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
}: {
  col: KanbanColumn;
  config: typeof COLUMNS[number];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (status: LeadStatus) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  return (
    <div
      className="flex h-full w-64 shrink-0 flex-col rounded-2xl transition-all"
      style={{
        background: isDragOver ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
        border: isDragOver
          ? `1px solid ${config.dot}55`
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isDragOver ? `0 0 24px ${config.glow}` : undefined,
        minHeight: '120px',
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(col.status)}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: config.dot, boxShadow: `0 0 6px ${config.glow}` }}
          />
          <span className="text-xs font-semibold text-white/80">{config.label}</span>
        </div>
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white/60"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          {col.total}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3 scrollbar-thin">
        {col.items.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-[11px] text-white/20">Drop leads here</p>
          </div>
        )}
        {col.items.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} />
        ))}
        {col.total > col.items.length && (
          <p className="text-center text-[10px] text-white/25 py-1">
            +{col.total - col.items.length} more
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);
  const draggingId = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout((window as any).__leadSearchTimer);
    (window as any).__leadSearchTimer = setTimeout(() => {
      setDebouncedSearch(v);
    }, 350);
  }, []);

  const { data: columns, isLoading, isError } = useQuery<KanbanColumn[]>({
    queryKey: ['leads-kanban', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get<{ data: KanbanColumn[] }>(`/leads/kanban?${params}`);
      return res.data.data;
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      api.patch(`/leads/${id}/move`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads-kanban'] }),
  });

  function handleDragStart(e: React.DragEvent, id: string) {
    draggingId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  }

  function handleDrop(status: LeadStatus) {
    const id = draggingId.current;
    setDragOverStatus(null);
    draggingId.current = null;
    if (!id) return;

    // Find current status of lead and skip if same column
    const currentCol = columns?.find((c) => c.items.some((l) => l.id === id));
    if (currentCol?.status === status) return;

    moveMutation.mutate({ id, status });
  }

  // Total leads across all columns
  const totalLeads = columns?.reduce((sum, c) => sum + c.total, 0) ?? 0;

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-[-0.02em] text-white">
            <Target className="h-5 w-5 text-violet-400" /> Leads Pipeline
          </h1>
          <p className="mt-0.5 text-sm text-white/40">
            {totalLeads > 0 ? `${totalLeads} leads across all stages` : 'Manage and move leads through your pipeline'}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            boxShadow: '0 0 16px rgba(124,58,237,0.35)',
          }}
        >
          <Plus className="h-4 w-4" /> Add lead
        </button>
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search leads by name, email or company…"
          className="w-full max-w-sm rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:ring-2 focus:ring-violet-500/30"
          style={glassFieldStyle}
        />
      </div>

      {/* Board */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-white/60">Failed to load pipeline.</p>
        </div>
      )}

      {!isLoading && columns && (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex h-full min-h-[500px] gap-3" style={{ minWidth: `${COLUMNS.length * 272}px` }}>
            {COLUMNS.map((config) => {
              const col = columns.find((c) => c.status === config.status) ?? {
                status: config.status,
                items: [],
                total: 0,
              };
              return (
                <KanbanCol
                  key={config.status}
                  col={col as KanbanColumn}
                  config={config}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  isDragOver={dragOverStatus === config.status}
                  onDragOver={(e) => handleDragOver(e, config.status)}
                  onDragLeave={() => setDragOverStatus(null)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Create drawer */}
      <CreateLeadDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
