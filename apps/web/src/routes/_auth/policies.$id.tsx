import { createFileRoute } from '@tanstack/react-router';
import { PolicyDetailPage } from '@/components/pages/PolicyDetailPage';

export const Route = createFileRoute('/_auth/policies/$id')({
  component: PolicyDetailPage,
});
