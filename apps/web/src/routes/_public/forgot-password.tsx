import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/_public/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.055)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              boxShadow: '0 0 32px rgba(124,58,237,0.45)',
            }}
          >
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">Forgot Password</h1>
            <p className="mt-1 text-sm text-white/50">
              We'll send you a reset link
            </p>
          </div>
        </div>

        {/* Coming soon placeholder */}
        <p className="mb-6 text-center text-sm text-white/40">
          Password reset coming in Sprint&nbsp;0.3
        </p>

        <Link
          to="/login"
          className="block w-full rounded-xl py-2.5 text-center text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
