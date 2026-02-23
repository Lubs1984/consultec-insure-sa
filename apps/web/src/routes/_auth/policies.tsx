import { createFileRoute } from '@tanstack/react-router';
import { PoliciesPage } from '@/components/pages/PoliciesPage';

export const Route = createFileRoute('/_auth/policies')({
  component: PoliciesPage,
});
