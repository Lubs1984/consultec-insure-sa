import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/_public/register')({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div
      className="rounded-2xl p-8"
      style={{
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
        >
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-[-0.02em]">Register your FSP</h1>
          <p className="text-xs text-white/40">Get started with InsureConsultec</p>
        </div>
      </div>

      {/* Placeholder — full form Sprint 0.3 */}
      <div
        className="rounded-xl p-4 text-center text-sm text-white/50"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        Registration form coming in Sprint 0.3
      </div>

      <p className="mt-5 text-center text-xs text-white/35">
        Already registered?{' '}
        <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Sign in
        </Link>
      </p>
    </div>
  );
}
