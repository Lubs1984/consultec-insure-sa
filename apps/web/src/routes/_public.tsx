import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/_public')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="min-h-svh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient orbs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-40 -left-40 h-[700px] w-[700px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgba(124,58,237,0.6) 0%, rgba(124,58,237,0) 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute -bottom-60 -right-40 h-[600px] w-[600px] rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle, rgba(79,70,229,0.5) 0%, rgba(79,70,229,0) 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] opacity-10"
          style={{
            background:
              'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <Outlet />
      </div>
    </div>
  );
}
