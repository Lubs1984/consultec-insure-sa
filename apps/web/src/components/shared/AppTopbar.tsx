import { useRouterState } from '@tanstack/react-router';
import { Search, Bell, Plus } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/leads': 'Leads',
  '/policies': 'Policies',
  '/claims': 'Claims',
  '/crm': 'CRM',
  '/fica': 'FICA / CDD',
  '/fna': 'Financial Needs Analysis',
  '/roas': 'Records of Advice',
  '/agents': 'Agents',
  '/commission': 'Commission',
  '/accounting': 'Accounting',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
};

export function AppTopbar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const title = ROUTE_LABELS[pathname] ?? 'InsureConsultec';

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-4 px-6"
      style={{
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Page title */}
      <h1 className="text-sm font-semibold text-white/80 tracking-[-0.01em]">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-white/40 transition-all cursor-pointer hover:text-white/70"
        style={{
          background: 'rgba(255,255,255,0.055)',
          border: '1px solid rgba(255,255,255,0.08)',
          minWidth: '180px',
        }}
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">Search…</span>
        <kbd
          className="ml-auto rounded px-1 py-0.5 text-[10px] text-white/25"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Quick add */}
      <button
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-all"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
          boxShadow: '0 0 16px rgba(124,58,237,0.35)',
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        New
      </button>

      {/* Notifications bell */}
      <button
        className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/80"
      >
        <Bell className="h-4 w-4" />
        <span
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
          style={{ background: '#7c3aed', boxShadow: '0 0 6px rgba(124,58,237,0.7)' }}
        />
      </button>
    </header>
  );
}
