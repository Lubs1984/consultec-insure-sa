import { createFileRoute } from '@tanstack/react-router';
import { ClientsPage } from '@/components/pages/ClientsPage';

export const Route = createFileRoute('/_auth/clients')({
  component: ClientsPage,
});
