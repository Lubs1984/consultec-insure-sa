import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ShieldCheck, AlertTriangle, Edit2, Loader2,
  BadgeCheck, Clock, X, TrendingDown, User, Calendar,
  Banknote, RefreshCw, AlertCircle, Check, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type PolicyStatus = 'draft' | 'submitted' | 'underwriting' | 'active' | 'amended' | 'lapsed' | 'reinstated' | 'cancelled';

interface Policy {
  id: string;
  policyNumber: string;
  status: PolicyStatus;
  productCategory: string;
  productName: string;
  insurerName: string;
  insurerPolicyRef?: string | null;
  sumAssured: string;
  monthlyPremium: string;
  annualPremium?: string | null;
  premiumFrequency: string;
  collectionMethod: string;
  escalationRate?: string | null;
  inceptionDate: string;
  expiryDate?: string | null;
  lapseDate?: string | null;
  cancellationDate?: string | null;
  cancellationReason?: string | null;
  initialCommissionPct?: string | null;
  renewalCommissionPct?: string | null;
  clawbackWatchUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string; firstName: string; lastName: string;
    email?: string | null; mobilePhone?: string | null;
  };
  roas?: any[];
  claims?: any[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PolicyStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft:          { label: 'Draft',          color: 'text-white/60',   bg: 'rgba(255,255,255,0.08)', icon: Clock },
  submitted:      { label: 'Submitted',      color: 'text-blue-400',   bg: 'rgba(59,130,246,0.15)',  icon: Clock },
  underwriting:   { label: 'Underwriting',   color: 'text-purple-400', bg: 'rgba(168,85,247,0.15)', icon: Clock },
  active:         { label: 'Active',         color: 'text-emerald-400',bg: 'rgba(16,185,129,0.15)', icon: BadgeCheck },
  amended:        { label: 'Amended',        color: 'text-amber-400',  bg: 'rgba(245,158,11,0.15)', icon: BadgeCheck },
  lapsed:         { label: 'Lapsed',         color: 'text-red-400',    bg: 'rgba(239,68,68,0.12)',  icon: AlertTriangle },
  reinstated:     { label: 'Reinstated',     color: 'text-teal-400',   bg: 'rgba(20,184,166,0.15)', icon: TrendingDown },
  cancelled:      { label: 'Cancelled',      color: 'text-white/30',   bg: 'rgba(255,255,255,0.05)', icon: X },
};

const TRANSITION_BUTTONS: Record<PolicyStatus, { label: string; to: PolicyStatus; variant: 'primary' | 'warning' | 'danger' | 'success' }[]> = {
  draft:          [{ label: 'Submit for underwriting', to: 'submitted', variant: 'primary' }, { label: 'Cancel', to: 'cancelled', variant: 'danger' }],
  submitted:      [{ label: 'Move to Underwriting', to: 'underwriting', variant: 'primary' }, { label: 'Cancel', to: 'cancelled', variant: 'danger' }],
  underwriting:   [{ label: 'Activate', to: 'active', variant: 'success' }, { label: 'Cancel', to: 'cancelled', variant: 'danger' }],
  active:         [{ label: 'Amend', to: 'amended', variant: 'warning' }, { label: 'Lapse', to: 'lapsed', variant: 'warning' }, { label: 'Cancel', to: 'cancelled', variant: 'danger' }],
  amended:        [{ label: 'Reactivate', to: 'active', variant: 'success' }, { label: 'Lapse', to: 'lapsed', variant: 'warning' }, { label: 'Cancel', to: 'cancelled', variant: 'danger' }],
  lapsed:         [{ label: 'Reinstate', to: 'reinstated', variant: 'success' }, { label: 'Cancel', to: 'cancelled', variant: 'danger' }],
  reinstated:     [{ label: 'Activate', to: 'active', variant: 'success' }, { label: 'Lapse', to: 'lapsed', variant: 'warning' }, { label: 'Cancel', to: 'cancelled', variant: 'danger' }],
  cancelled:      [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function zarFormat(val?: string | number | null) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(val));
}

function pctFormat(val?: string | number | null) {
  if (val == null) return '—';
  return `${(Number(val) * 100).toFixed(2)}%`;
}

function dateFormat(val?: string | null) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

const glass = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

// ── Info block ─────────────────────────────────────────────────────────────────

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/35">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={glass}>
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
        <Icon className="h-3.5 w-3.5" />{title}
      </h2>
      {children}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PolicyStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', cfg.color)} style={{ background: cfg.bg }}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

// ── Transition modal ───────────────────────────────────────────────────────────

function TransitionModal({
  open, onClose, toStatus, policyId, onDone,
}: {
  open: boolean; onClose: () => void; toStatus: PolicyStatus; policyId: string; onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => api.patch(`/policies/${policyId}/status`, {
      status: toStatus,
      reason: reason || undefined,
    }),
    onSuccess: () => { onDone(); onClose(); },
  });

  if (!open) return null;

  const cfg = STATUS_CONFIG[toStatus];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
        style={{ background: 'rgba(20,16,40,0.97)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
      >
        <h3 className={cn('text-base font-bold mb-1', cfg.color)}>
          Move to {cfg.label}
        </h3>
        <p className="text-xs text-white/40 mb-4">Confirm the status change for this policy.</p>

        {mutation.isError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl p-3 text-xs" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-red-300">
              {(mutation.error as any)?.response?.data?.error?.message ?? 'Transition failed.'}
            </span>
          </div>
        )}

        {(toStatus === 'cancelled' || toStatus === 'lapsed') && (
          <div className="mb-4">
            <label className="block text-xs text-white/50 mb-1.5">Reason {toStatus === 'cancelled' ? '(optional)' : ''}</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={toStatus === 'cancelled' ? 'Cancellation reason…' : 'Lapse reason…'}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm text-white/60 hover:text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={cn('flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60',)}
            style={{
              background: toStatus === 'cancelled' || toStatus === 'lapsed'
                ? 'rgba(239,68,68,0.3)'
                : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              border: toStatus === 'cancelled' || toStatus === 'lapsed' ? '1px solid rgba(239,68,68,0.4)' : 'none',
            }}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function PolicyDetailPage() {
  const { id } = useParams({ from: '/_auth/policies/$id' } as any);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [transitionTo, setTransitionTo] = useState<PolicyStatus | null>(null);

  const { data, isLoading, isError } = useQuery<Policy>({
    queryKey: ['policy', id],
    queryFn: async () => {
      const res = await api.get<{ data: Policy }>(`/policies/${id}`);
      return res.data.data;
    },
  });

  function handleDone() {
    queryClient.invalidateQueries({ queryKey: ['policy', id] });
    queryClient.invalidateQueries({ queryKey: ['policies'] });
  }

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
    </div>
  );

  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center gap-3 p-12">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-sm text-white/60">Policy not found or failed to load.</p>
      <button onClick={() => navigate({ to: '/policies' } as any)} className="text-xs text-violet-400 hover:text-violet-300">
        ← Back to policies
      </button>
    </div>
  );

  const transitions = TRANSITION_BUTTONS[data.status] ?? [];
  const isClawbackActive = data.clawbackWatchUntil && new Date(data.clawbackWatchUntil) > new Date();

  return (
    <div className="flex flex-col gap-5 p-6 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/policies' } as any)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All policies
      </button>

      {/* Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 0 40px rgba(124,58,237,0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
            >
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-[-0.02em]">{data.productName}</h1>
              <p className="text-sm text-white/50">{data.insurerName} · #{data.policyNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={data.status} />
            {isClawbackActive && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-amber-400" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <AlertTriangle className="h-3 w-3" /> Clawback watch until {dateFormat(data.clawbackWatchUntil)}
              </span>
            )}
          </div>
        </div>

        {/* Key numbers row */}
        <div className="mt-5 flex flex-wrap gap-6">
          <div>
            <p className="text-[11px] text-white/35 uppercase tracking-wide">Sum Assured</p>
            <p className="text-xl font-bold text-white">{zarFormat(data.sumAssured)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/35 uppercase tracking-wide">Monthly Premium</p>
            <p className="text-xl font-bold text-white">{zarFormat(data.monthlyPremium)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/35 uppercase tracking-wide">Inception</p>
            <p className="text-xl font-bold text-white">{dateFormat(data.inceptionDate)}</p>
          </div>
          {data.expiryDate && (
            <div>
              <p className="text-[11px] text-white/35 uppercase tracking-wide">Expiry</p>
              <p className="text-xl font-bold text-white">{dateFormat(data.expiryDate)}</p>
            </div>
          )}
        </div>

        {/* Transition actions */}
        {transitions.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.to}
                onClick={() => setTransitionTo(t.to)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                  t.variant === 'success' && 'text-emerald-300',
                  t.variant === 'warning' && 'text-amber-300',
                  t.variant === 'danger'  && 'text-red-300',
                  t.variant === 'primary' && 'text-violet-200',
                )}
                style={{
                  background:
                    t.variant === 'success' ? 'rgba(16,185,129,0.15)' :
                    t.variant === 'warning' ? 'rgba(245,158,11,0.15)' :
                    t.variant === 'danger'  ? 'rgba(239,68,68,0.15)'  :
                    'rgba(124,58,237,0.2)',
                  border: `1px solid ${
                    t.variant === 'success' ? 'rgba(16,185,129,0.3)' :
                    t.variant === 'warning' ? 'rgba(245,158,11,0.3)' :
                    t.variant === 'danger'  ? 'rgba(239,68,68,0.3)'  :
                    'rgba(124,58,237,0.3)'
                  }`,
                }}
              >
                <ChevronRight className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Policy Details" icon={ShieldCheck}>
          <InfoGrid items={[
            { label: 'Category',         value: data.productCategory.replace(/_/g, ' ') },
            { label: 'Insurer Ref',      value: data.insurerPolicyRef ?? '—' },
            { label: 'Premium Frequency',value: data.premiumFrequency.replace(/_/g, ' ') },
            { label: 'Collection',       value: data.collectionMethod.replace(/_/g, ' ') },
            { label: 'Escalation Rate',  value: data.escalationRate ? pctFormat(data.escalationRate) : '—' },
            { label: 'Annual Premium',   value: data.annualPremium ? zarFormat(data.annualPremium) : zarFormat(Number(data.monthlyPremium) * 12) },
          ]} />
        </Section>

        <Section title="Commission" icon={Banknote}>
          <InfoGrid items={[
            { label: 'Initial Commission',value: pctFormat(data.initialCommissionPct) },
            { label: 'Renewal Commission',value: pctFormat(data.renewalCommissionPct) },
            { label: 'Clawback Until',    value: dateFormat(data.clawbackWatchUntil) },
          ]} />
          {data.lapseDate && (
            <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs text-red-300"><span className="font-bold">Lapsed:</span> {dateFormat(data.lapseDate)}</p>
            </div>
          )}
          {data.cancellationDate && (
            <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs text-red-300">
                <span className="font-bold">Cancelled:</span> {dateFormat(data.cancellationDate)}
                {data.cancellationReason && <> — {data.cancellationReason}</>}
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* Client */}
      <Section title="Client" icon={User}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}>
            {data.client.firstName[0]}{data.client.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{data.client.firstName} {data.client.lastName}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {data.client.email && <span className="text-[11px] text-white/40">{data.client.email}</span>}
              {data.client.mobilePhone && <span className="text-[11px] text-white/40">{data.client.mobilePhone}</span>}
            </div>
          </div>
          <button
            onClick={() => navigate({ to: '/clients' } as any)}
            className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            View client →
          </button>
        </div>
      </Section>

      {/* ROAs & Claims stubs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Records of Advice" icon={RefreshCw}>
          {(!data.roas || data.roas.length === 0) ? (
            <p className="text-xs text-white/30">No ROAs linked yet.</p>
          ) : (
            <p className="text-xs text-white/50">{data.roas.length} ROA(s) on file</p>
          )}
        </Section>
        <Section title="Claims" icon={AlertCircle}>
          {(!data.claims || data.claims.length === 0) ? (
            <p className="text-xs text-white/30">No claims on this policy.</p>
          ) : (
            <p className="text-xs text-white/50">{data.claims.length} claim(s)</p>
          )}
        </Section>
      </div>

      {/* Timestamps */}
      <div className="flex gap-6 text-[11px] text-white/25">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created {dateFormat(data.createdAt)}</span>
        <span className="flex items-center gap-1"><Edit2 className="h-3 w-3" /> Updated {dateFormat(data.updatedAt)}</span>
      </div>

      {/* Transition modal */}
      {transitionTo && (
        <TransitionModal
          open={true}
          onClose={() => setTransitionTo(null)}
          toStatus={transitionTo}
          policyId={data.id}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
