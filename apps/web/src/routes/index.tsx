import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    throw redirect({ to: isAuthenticated ? '/dashboard' : '/login' });
  },
  component: () => null,
});
