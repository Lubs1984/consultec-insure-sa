import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { AppTopbar } from '@/components/shared/AppTopbar';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex h-svh overflow-hidden">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
