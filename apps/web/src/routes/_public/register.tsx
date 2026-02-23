import { createFileRoute } from '@tanstack/react-router';
import { RegisterPage } from '@/components/pages/RegisterPage';

export const Route = createFileRoute('/_public/register')({
  component: RegisterPage,
});
