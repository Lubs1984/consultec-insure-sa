import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText, Plus, Search, X, Loader2, AlertCircle, Check,
  ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle,
  TrendingDown, BadgeCheck, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type PolicyStatus = 'draft' | 'submitted' | 'underwriting' | 'active' | 'amended' | 'lapsed' | 'reinstated' | 'cancelled';
type ProductCategory = 'life' | 'disability_lump' | 'income_protection' | 'critical_illness' | 'funeral' | 'short_term_personal' | 'short_term_commercial' | 'medical_aid' | 'gap_cover' | 'retrenchment' | 'investment' | 'key_person';

interface Policy {
  id: string;
  policyNumber: string;
  status: PolicyStatus;
  productCategory: ProductCategory;
  productName: string;
  insurerName: string;
  sumAssured: string;
  monthlyPremium: string;
  inceptionDate: string;
  expiryDate?: string | null;
  clawbackWatchUntil?: string | null;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string; email?: string | null };
}

interface PagedPolicies {
  items: Policy[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PolicyStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft:          { label: 'Draft',          color: 'text-white/50',   bg: 'rgba(255,255,255,0.08)', icon: Clock },
  submitted:      { label: 'Submitted',      color: 'text-blue-400',   bg: 'rgba(59,130,246,0.15)',  icon: Clock },
  underwriting:   { label: 'Underwriting',   color: 'text-purple-400', bg: 'rgba(168,85,247,0.15)', icon: Clock },
  active:         { label: 'Active',         color: 'text-emerald-400',bg: 'rgba(16,185,129,0.15)', icon: BadgeCheck },
  amended:        { label: 'Amended',        color: 'text-amber-400',  bg: 'rgba(245,158,11,0.15)', icon: BadgeCheck },
  lapsed:         { label: 'Lapsed',         color: 'text-red-400',    bg: 'rgba(239,68,68,0.12)',  icon: AlertTriangle },
  reinstated:     { label: 'Reinstated',     color: 'text-teal-400',   bg: 'rgba(20,184,166,0.15)', icon: TrendingDown },
  cancelled:      { label: 'Cancelled',      color: 'text-white/30',   bg: 'rgba(255,255,255,0.05)', icon: X },
};

const PRODUCT_LABELS: Record<ProductCategory, string> = {
  life:                   'Life Cover',
  disability_lump:        'Disability Lump Sum',
  income_protection:      'Income Protection',
  critical_illness:       'Critical Illness',
  funeral:                'Funeral Cover',
  short_term_personal:    'Short-Term Personal',
  short_term_commercial:  'Short-Term Commercial',
  medical_aid:            'Medical Aid',
  gap_cover:              'Gap Cover',
  retrenchment:           'Retrenchment',
  investment:             'Investment',
  key_person:             'Key Person',
};

const PRODUCT_CATEGORIES = Object.keys(PRODUCT_LABELS) as ProductCategory[];
const PREMIUM_FREQUENCIES = ['monthly','quarterly','bi_annual','annual','once_off'] as const;
const COLLECTION_METHODS  = ['debit_order','eft','stop_order','credit_card','cash'] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function zarFormat(val: string | number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(Number(val));
}

const glassField = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

function GlassInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none
                 placeholder:text-white/25 focus:ring-2 focus:ring-violet-500/30 transition-all"
      style={error ? { ...glassField, border: '1px solid rgba(248,113,113,0.4)' } : glassField}
      {...props}
    />
  );
}

function GlassSelect({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none cursor-pointer
                 focus:ring-2 focus:ring-violet-500/30 transition-all"
      style={error ? { ...glassField, border: '1px solid rgba(248,113,113,0.4)' } : glassField}
      {...props}
    >
      {children}
    </select>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PolicyStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', cfg.color)}
      style={{ background: cfg.bg }}
    >
      <Icon className="h-2.5 w-2.5" /> {cfg.label}
    </span>
  );
}

// ── Create Policy Drawer ───────────────────────────────────────────────────────

const CreateSchema = z.object({
  clientId:         z.string().uuid('Select a client'),
  agentId:          z.string().uuid().optional().or(z.literal('')),
  policyNumber:     z.string().min(1, 'Required').max(50),
  productCategory:  z.enum(PRODUCT_CATEGORIES as unknown as [ProductCategory, ...ProductCategory[]]),
  productName:      z.string().min(1, 'Required').max(200),
  insurerName:      z.string().min(1, 'Required').max(200),
  insurerPolicyRef: z.string().max(100).optional().or(z.literal('')),
  sumAssured:       z.coerce.number().positive('Must be > 0'),
  monthlyPremium:   z.coerce.number().positive('Must be > 0'),
  premiumFrequency: z.enum(PREMIUM_FREQUENCIES).optional(),
  collectionMethod: z.enum(COLLECTION_METHODS).optional(),
  inceptionDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  expiryDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  initialCommissionPct: z.coerce.number().min(0).max(100).optional(),
  renewalCommissionPct: z.coerce.number().min(0).max(100).optional(),
});
type CreateForm = z.infer<typeof CreateSchema>;

function CreatePolicyDrawer({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: string }) {
  const queryClient = useQueryClient();
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(CreateSchema),
    defaultValues: { premiumFrequency: 'monthly', collectionMethod: 'debit_order', productCategory: 'life' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateForm) => {
      const payload: any = {
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)),
        agentId: data.agentId || userId,
        initialCommissionPct: data.initialCommissionPct ? data.initialCommissionPct / 100 : undefined,
        renewalCommissionPct: data.renewalCommissionPct ? data.renewalCommissionPct / 100 : undefined,
      };
      return api.post('/policies', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['policies'] }); reset(); onClose(); },
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto p-6"
        style={{
          background: 'rgba(15,12,30,0.96)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '-32px 0 80px rgba(0,0,0,0.5)',
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">New policy</h2>
            <p className="text-xs text-white/40 mt-0.5">Record a client policy</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {mutation.isError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span className="text-red-300">
              {(mutation.error as any)?.response?.data?.error?.message ?? 'Could not create policy.'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">
          {/* Client ID */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Client ID (UUID) *</label>
            <GlassInput placeholder="Paste client UUID" error={!!errors.clientId} {...register('clientId')} />
            {errors.clientId && <p className="mt-1 text-[11px] text-red-400">{errors.clientId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Product category *</label>
              <GlassSelect error={!!errors.productCategory} {...register('productCategory')}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#1e1b2e' }}>{PRODUCT_LABELS[c]}</option>
                ))}
              </GlassSelect>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Policy number *</label>
              <GlassInput placeholder="e.g. POL-2026-001" error={!!errors.policyNumber} {...register('policyNumber')} />
              {errors.policyNumber && <p className="mt-1 text-[11px] text-red-400">{errors.policyNumber.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Product name *</label>
            <GlassInput placeholder="e.g. FundsAtWork Umbrella Life" error={!!errors.productName} {...register('productName')} />
            {errors.productName && <p className="mt-1 text-[11px] text-red-400">{errors.productName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Insurer *</label>
              <GlassInput placeholder="e.g. Momentum Life" error={!!errors.insurerName} {...register('insurerName')} />
              {errors.insurerName && <p className="mt-1 text-[11px] text-red-400">{errors.insurerName.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Insurer policy ref</label>
              <GlassInput placeholder="Insurer ref number" {...register('insurerPolicyRef')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Sum assured (ZAR) *</label>
              <GlassInput type="number" min="0" placeholder="1500000" error={!!errors.sumAssured} {...register('sumAssured')} />
              {errors.sumAssured && <p className="mt-1 text-[11px] text-red-400">{errors.sumAssured.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Monthly premium (ZAR) *</label>
              <GlassInput type="number" min="0" placeholder="950" error={!!errors.monthlyPremium} {...register('monthlyPremium')} />
              {errors.monthlyPremium && <p className="mt-1 text-[11px] text-red-400">{errors.monthlyPremium.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Premium frequency</label>
              <GlassSelect {...register('premiumFrequency')}>
                {PREMIUM_FREQUENCIES.map((f) => <option key={f} value={f} style={{ background: '#1e1b2e' }}>{f.replace('_', '-')}</option>)}
              </GlassSelect>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Collection method</label>
              <GlassSelect {...register('collectionMethod')}>
                {COLLECTION_METHODS.map((m) => <option key={m} value={m} style={{ background: '#1e1b2e' }}>{m.replace('_', ' ')}</option>)}
              </GlassSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Inception date *</label>
              <GlassInput type="date" error={!!errors.inceptionDate} {...register('inceptionDate')} />
              {errors.inceptionDate && <p className="mt-1 text-[11px] text-red-400">{errors.inceptionDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Expiry date</label>
              <GlassInput type="date" {...register('expiryDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Initial commission %</label>
              <GlassInput type="number" step="0.01" min="0" max="100" placeholder="7.5" {...register('initialCommissionPct')} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Renewal commission %</label>
              <GlassInput type="number" step="0.01" min="0" max="100" placeholder="3" {...register('renewalCommissionPct')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white/60 hover:text-white" style={glassField}>Cancel</button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}
            >
              {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save policy</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Policy row ─────────────────────────────────────────────────────────────────

function PolicyRow({ policy, onClick }: { policy: Policy; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Category icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
      >
        <ShieldCheck className="h-4 w-4 text-violet-400" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">{policy.productName}</span>
          <StatusBadge status={policy.status} />
          {policy.clawbackWatchUntil && new Date(policy.clawbackWatchUntil) > new Date() && (
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-amber-400" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <AlertTriangle className="h-2.5 w-2.5" /> Clawback watch
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-white/40">{policy.insurerName}</span>
          <span className="text-[11px] text-white/30">#{policy.policyNumber}</span>
          <span className="text-[11px] text-white/40">
            {policy.client.firstName} {policy.client.lastName}
          </span>
        </div>
      </div>

      {/* Financials */}
      <div className="shrink-0 text-right hidden sm:block">
        <p className="text-sm font-bold text-white">{zarFormat(policy.monthlyPremium)}<span className="text-xs font-normal text-white/40">/mo</span></p>
        <p className="text-[11px] text-white/40">SA {zarFormat(policy.sumAssured)}</p>
      </div>

      {/* Category pill */}
      <span
        className="hidden lg:inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-violet-300"
        style={{ background: 'rgba(124,58,237,0.15)' }}
      >
        {PRODUCT_LABELS[policy.productCategory]}
      </span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PoliciesPage() {
  const navigate = useNavigate();
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDS]    = useState('');
  const [statusFilter, setStatusFilter]   = useState<PolicyStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('');
  const [page, setPage]             = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Stub userId — replace with real auth store value
  const userId = 'stub';

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout((window as any).__policySearchTimer);
    (window as any).__policySearchTimer = setTimeout(() => { setDS(v); setPage(1); }, 350);
  }, []);

  const { data, isLoading, isError } = useQuery<PagedPolicies>({
    queryKey: ['policies', debouncedSearch, statusFilter, categoryFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter)    params.set('status', statusFilter);
      if (categoryFilter)  params.set('productCategory', categoryFilter);
      const res = await api.get<{ data: PagedPolicies }>(`/policies?${params}`);
      return res.data.data;
    },
  });

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-[-0.02em] text-white">
            <FileText className="h-5 w-5 text-violet-400" /> Policies
          </h1>
          <p className="mt-0.5 text-sm text-white/40">
            {data ? `${data.total.toLocaleString()} polic${data.total !== 1 ? 'ies' : 'y'}` : 'Manage your policy book'}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}
        >
          <Plus className="h-4 w-4" /> Add policy
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="search" value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by policy number, product, insurer, client…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:ring-2 focus:ring-violet-500/30"
            style={glassField}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
          className="rounded-xl px-3.5 py-2.5 text-sm text-white outline-none cursor-pointer"
          style={glassField}
        >
          <option value="" style={{ background: '#1e1b2e' }}>All statuses</option>
          {(Object.keys(STATUS_CONFIG) as PolicyStatus[]).map((s) => (
            <option key={s} value={s} style={{ background: '#1e1b2e' }}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value as any); setPage(1); }}
          className="rounded-xl px-3.5 py-2.5 text-sm text-white outline-none cursor-pointer"
          style={glassField}
        >
          <option value="" style={{ background: '#1e1b2e' }}>All products</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c} style={{ background: '#1e1b2e' }}>{PRODUCT_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-white/60">Failed to load policies.</p>
          </div>
        )}
        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <FileText className="h-12 w-12 text-white/10" />
            <p className="text-sm text-white/50">{debouncedSearch || statusFilter || categoryFilter ? 'No matching policies' : 'No policies yet'}</p>
          </div>
        )}
        {!isLoading && data && data.items.length > 0 && (
          <div className="space-y-1.5 px-4 py-3">
            {data.items.map((p) => (
              <PolicyRow key={p.id} policy={p} onClick={() => navigate({ to: '/policies/$id', params: { id: p.id } } as any)} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white/60 hover:text-white disabled:opacity-30" style={glassField}>
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="text-xs text-white/40">Page {page} of {data.pages}</span>
          <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white/60 hover:text-white disabled:opacity-30" style={glassField}>
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <CreatePolicyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} userId={userId} />
    </div>
  );
}
