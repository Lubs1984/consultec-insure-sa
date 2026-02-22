import {
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  Target,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface StatCardProps {
  title: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: React.ElementType;
  accentColor: string;
  glowColor: string;
}

function StatCard({ title, value, delta, deltaPositive, icon: Icon, accentColor, glowColor }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.052)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
        aria-hidden
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/45 tracking-wide">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">{value}</p>
          {delta && (
            <div className={cn(
              'mt-1.5 flex items-center gap-1 text-[11px] font-medium',
              deltaPositive ? 'text-emerald-400' : 'text-red-400',
            )}>
              {deltaPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {delta} this month
            </div>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: accentColor,
            boxShadow: `0 0 16px ${glowColor}80`,
          }}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

const STATS: StatCardProps[] = [
  {
    title: 'Active Clients',
    value: '284',
    delta: '+12',
    deltaPositive: true,
    icon: Users,
    accentColor: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    glowColor: 'rgba(124,58,237,0.6)',
  },
  {
    title: 'Active Policies',
    value: '612',
    delta: '+28',
    deltaPositive: true,
    icon: FileText,
    accentColor: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    glowColor: 'rgba(14,165,233,0.5)',
  },
  {
    title: 'Commission (MTD)',
    value: 'R 48 200',
    delta: '+6.2%',
    deltaPositive: true,
    icon: TrendingUp,
    accentColor: 'linear-gradient(135deg, #059669, #10b981)',
    glowColor: 'rgba(16,185,129,0.5)',
  },
  {
    title: 'Lapse Risks',
    value: '7',
    delta: '+3',
    deltaPositive: false,
    icon: AlertTriangle,
    accentColor: 'linear-gradient(135deg, #b45309, #f59e0b)',
    glowColor: 'rgba(245,158,11,0.5)',
  },
  {
    title: 'Open Leads',
    value: '43',
    delta: '+9',
    deltaPositive: true,
    icon: Target,
    accentColor: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    glowColor: 'rgba(168,85,247,0.5)',
  },
  {
    title: 'ROA Compliance',
    value: '94%',
    delta: '+2%',
    deltaPositive: true,
    icon: ShieldCheck,
    accentColor: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    glowColor: 'rgba(20,184,166,0.5)',
  },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
          {greeting},{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {user?.firstName ?? 'there'}
          </span>
        </h2>
        <p className="mt-1 text-sm text-white/40">
          Here's what's happening with your portfolio today.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-3">
        {STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.045)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <h3 className="mb-4 text-sm font-semibold text-white/80">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'New client added', name: 'Thabo Mokoena', time: '5 min ago', color: '#7c3aed' },
              { action: 'Policy activated', name: 'FNB Life Cover — R2M', time: '32 min ago', color: '#0284c7' },
              { action: 'ROA filed', name: 'Zanele Dlamini', time: '1 hr ago', color: '#059669' },
              { action: 'Claim lodged', name: 'Discovery Vitality', time: '2 hrs ago', color: '#f59e0b' },
              { action: 'Commission received', name: 'R 3 400 — January', time: '3 hrs ago', color: '#10b981' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white/70">
                    <span className="font-medium text-white/90">{item.action}</span>
                    {' — '}
                    {item.name}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-white/30">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action items */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.045)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <h3 className="mb-4 text-sm font-semibold text-white/80">Action Items</h3>
          <div className="space-y-2">
            {[
              { label: '3 policies up for renewal in 7 days', urgency: 'high', badgeColor: '#f59e0b' },
              { label: '2 ROAs outstanding (>7 days)', urgency: 'high', badgeColor: '#f87171' },
              { label: 'FICA refresh due — 5 clients', urgency: 'medium', badgeColor: '#60a5fa' },
              { label: 'CPD: 4 hrs remaining to Q3 target', urgency: 'medium', badgeColor: '#a78bfa' },
              { label: '1 lapse — grace period ends Friday', urgency: 'critical', badgeColor: '#f43f5e' },
            ].map((item, i) => (
              <button
                key={i}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.06]"
                style={{ border: '1px solid transparent' }}
              >
                <div
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: item.badgeColor, boxShadow: `0 0 6px ${item.badgeColor}80` }}
                />
                <span className="flex-1 text-xs text-white/65">{item.label}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0 text-white/25" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
