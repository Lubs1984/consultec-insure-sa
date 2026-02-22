import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  UserCog,
  Briefcase,
  CreditCard,
  BarChart3,
  Bell,
  Layers,
  BookOpen,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Notifications', icon: Bell, to: '/notifications', badge: 3 },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Clients', icon: Users, to: '/clients' },
      { label: 'Leads', icon: Target, to: '/leads' },
      { label: 'Policies', icon: FileText, to: '/policies' },
      { label: 'Claims', icon: AlertCircle, to: '/claims' },
      { label: 'CRM', icon: Briefcase, to: '/crm' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'FICA / CDD', icon: ShieldCheck, to: '/fica' },
      { label: 'FNA', icon: BookOpen, to: '/fna' },
      { label: 'Records of Advice', icon: Layers, to: '/roas' },
      { label: 'Agents', icon: UserCog, to: '/agents' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Commission', icon: TrendingUp, to: '/commission' },
      { label: 'Accounting', icon: CreditCard, to: '/accounting' },
      { label: 'Reports', icon: BarChart3, to: '/reports' },
    ],
  },
];

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <aside
      className="relative flex h-full w-64 shrink-0 flex-col overflow-y-auto overflow-x-hidden"
      style={{
        background: 'rgba(255,255,255,0.035)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Top glow accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 50%, transparent)',
        }}
        aria-hidden
      />

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            boxShadow: '0 0 16px rgba(124,58,237,0.45)',
          }}
        >
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-white">InsureConsultec</span>
          <span className="text-[10px] text-white/40 tracking-wide uppercase">
            {user?.role?.replace(/_/g, ' ') ?? 'Agent Platform'}
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 space-y-5 px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.to || pathname.startsWith(item.to + '/');
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                        isActive
                          ? 'bg-[rgba(124,58,237,0.18)] text-white shadow-[inset_0_0_0_1px_rgba(124,58,237,0.3)]'
                          : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[17px] w-[17px] shrink-0 transition-colors',
                          isActive ? 'text-violet-400' : 'text-white/40 group-hover:text-white/70',
                        )}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      <span className="flex-1 font-medium tracking-[-0.01em]">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                            boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 text-violet-400 opacity-70" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User profile footer ───────────────────────────────────── */}
      <div
        className="mx-3 mb-4 rounded-xl p-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            }}
          >
            {user ? getInitials(`${user.firstName} ${user.lastName}`) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white/90">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading…'}
            </p>
            <p className="truncate text-[10px] text-white/40">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white/70"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
