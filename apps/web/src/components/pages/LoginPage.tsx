import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { LoginSchema, type LoginDto } from '@insureconsultec/shared';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginDto) => {
    setServerError(null);
    try {
      const res = await api.post<{
        data: {
          accessToken: string;
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            tenant: { id: string; companyName: string; slug: string; status: string };
          };
        };
      }>('/auth/login', data);

      const { accessToken, user } = res.data.data;
      setAuth(
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as any,
          tenantId: user.tenant.id,
        },
        accessToken,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: '/dashboard' } as any);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        'Invalid email or password. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div
      className="rounded-2xl p-8"
      style={{
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            boxShadow: '0 0 24px rgba(124,58,237,0.5)',
          }}
        >
          <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-white tracking-[-0.02em]">
            InsureConsultec
          </h1>
          <p className="text-sm text-white/45 mt-0.5">Sign in to your account</p>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl p-3 text-sm"
          style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.25)',
          }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span className="text-red-300">{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@yourfsp.co.za"
            className={cn(
              'input-glass w-full px-3.5 py-2.5 text-sm',
              errors.email && 'border-red-400/40 focus:border-red-400/60',
            )}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[11px] text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/60" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              className={cn(
                'input-glass w-full px-3.5 py-2.5 pr-10 text-sm',
                errors.password && 'border-red-400/40',
              )}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            boxShadow: isSubmitting ? 'none' : '0 0 20px rgba(124,58,237,0.4), 0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-xs text-white/35">
        New FSP?{' '}
        <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
          Register your practice
        </Link>
      </p>
    </div>
  );
}
