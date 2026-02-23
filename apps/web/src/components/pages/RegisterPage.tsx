import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldCheck, Loader2, AlertCircle, ArrowLeft, ArrowRight,
  Eye, EyeOff, Building2, User, CheckCircle2,
} from 'lucide-react';
import { RegisterTenantSchema, FspCategory, type RegisterTenantDto } from '@insureconsultec/shared';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// Add confirmPassword to the form schema
const FormSchema = RegisterTenantSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }
});
type FormValues = z.infer<typeof FormSchema>;

const FSP_CATEGORIES = [
  { value: FspCategory.I,   label: 'Category I — Directly authorised representative' },
  { value: FspCategory.II,  label: 'Category II — Discretionary FSP' },
  { value: FspCategory.IIA, label: 'Category IIA — Hedge fund FSP' },
  { value: FspCategory.III, label: 'Category III — Administrative FSP' },
  { value: FspCategory.IV,  label: 'Category IV — Assistance business FSP' },
];

const STEPS = [
  { id: 1, label: 'FSP Details', icon: Building2 },
  { id: 2, label: 'Your Account', icon: User },
];

// Shared glass field styles
const fieldBase =
  'w-full rounded-xl border px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25';
const fieldStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
};
const fieldFocusStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(124,58,237,0.5)',
  boxShadow: '0 0 0 3px rgba(124,58,237,0.12)',
};
const fieldErrorStyle = { border: '1px solid rgba(248,113,113,0.4)' };

function GlassInput({
  id, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      className={cn(fieldBase)}
      style={error ? fieldErrorStyle : focused ? fieldFocusStyle : fieldStyle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  );
}

function GlassSelect({
  id, error, children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      id={id}
      className={cn(fieldBase, 'cursor-pointer')}
      style={error ? fieldErrorStyle : focused ? fieldFocusStyle : fieldStyle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    >
      {children}
    </select>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-white/60 mb-1.5">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-red-400">{message}</p>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { fspCategory: FspCategory.I },
  });

  // Auto-generate slug from fspName
  const fspName = watch('fspName');
  const slugValue = watch('slug');

  const toSlug = (v: string) =>
    v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Validate step 1 fields before proceeding
  const step1Fields: Array<keyof FormValues> = ['fspName', 'fspNumber', 'fspCategory', 'slug'];

  async function nextStep() {
    const valid = await trigger(step1Fields);
    if (valid) setStep(2);
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const { confirmPassword, ...payload } = data; // strip client-only field
    try {
      const res = await api.post<{
        data: {
          accessToken: string;
          user: {
            id: string; email: string; firstName: string; lastName: string;
            role: string;
            tenant: { id: string; companyName: string; slug: string; status: string };
          };
        };
      }>('/auth/register-tenant', payload);

      const { accessToken, user } = res.data.data;
      setAuth({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role as any, tenantId: user.tenant.id }, accessToken);
      navigate({ to: '/dashboard' } as any);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        'Registration failed. Please try again.';
      setServerError(msg);
      if (step === 2) setStep(1); // go back to show slug conflict errors
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
      {/* Header */}
      <div className="mb-6 flex flex-col items-center gap-3">
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
          <h1 className="text-lg font-bold text-white tracking-[-0.02em]">Register your FSP</h1>
          <p className="text-sm text-white/45 mt-0.5">Get started with InsureConsultec</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium transition-all',
                step === s.id ? 'text-violet-400' : step > s.id ? 'text-white/60' : 'text-white/25',
              )}
            >
              {step > s.id ? (
                <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
              ) : (
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                    step === s.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/10 text-white/30',
                  )}
                >
                  {s.id}
                </span>
              )}
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-1"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Server error */}
      {serverError && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl p-3 text-sm"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span className="text-red-300">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Step 1: FSP Details ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fspName">FSP / Practice name *</Label>
              <GlassInput
                id="fspName"
                type="text"
                placeholder="e.g. Smith Financial Services"
                error={!!errors.fspName}
                {...register('fspName')}
              />
              <FieldError message={errors.fspName?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fspNumber">FSCA licence number *</Label>
                <GlassInput
                  id="fspNumber"
                  type="text"
                  placeholder="e.g. FSP12345"
                  error={!!errors.fspNumber}
                  {...register('fspNumber')}
                />
                <FieldError message={errors.fspNumber?.message} />
              </div>
              <div>
                <Label htmlFor="fspCategory">FSP category *</Label>
                <GlassSelect
                  id="fspCategory"
                  error={!!errors.fspCategory}
                  {...register('fspCategory')}
                >
                  {FSP_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} style={{ background: '#1e1b2e', color: '#fff' }}>
                      {c.value}
                    </option>
                  ))}
                </GlassSelect>
                <FieldError message={errors.fspCategory?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="slug">Subdomain *</Label>
              <div className="flex items-center gap-0">
                <GlassInput
                  id="slug"
                  type="text"
                  placeholder={fspName ? toSlug(fspName) : 'smith-financial'}
                  error={!!errors.slug}
                  {...register('slug')}
                />
              </div>
              <p className="mt-1 text-[11px] text-white/30">
                {slugValue
                  ? `Your portal: ${slugValue}.insureconsultec.co.za`
                  : 'Lowercase letters, numbers and hyphens only'}
              </p>
              <FieldError message={errors.slug?.message} />
            </div>

            <div>
              <Label htmlFor="vatNumber">VAT number (optional)</Label>
              <GlassInput
                id="vatNumber"
                type="text"
                placeholder="10 digit VAT number"
                error={!!errors.vatNumber}
                {...register('vatNumber')}
              />
              <FieldError message={errors.vatNumber?.message} />
            </div>

            <button
              type="button"
              onClick={nextStep}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                boxShadow: '0 0 20px rgba(124,58,237,0.4), 0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Account Details ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name *</Label>
                <GlassInput
                  id="firstName"
                  type="text"
                  placeholder="John"
                  error={!!errors.firstName}
                  {...register('firstName')}
                />
                <FieldError message={errors.firstName?.message} />
              </div>
              <div>
                <Label htmlFor="lastName">Last name *</Label>
                <GlassInput
                  id="lastName"
                  type="text"
                  placeholder="Smith"
                  error={!!errors.lastName}
                  {...register('lastName')}
                />
                <FieldError message={errors.lastName?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email address *</Label>
              <GlassInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="john@smithfsp.co.za"
                error={!!errors.email}
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <Label htmlFor="mobile">Mobile number (optional)</Label>
              <GlassInput
                id="mobile"
                type="tel"
                placeholder="e.g. 0821234567"
                error={!!errors.mobile}
                {...register('mobile')}
              />
              <FieldError message={errors.mobile?.message} />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <GlassInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min 12 chars, upper, lower, number, symbol"
                  error={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errors.password?.message} />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password *</Label>
              <div className="relative">
                <GlassInput
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  error={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  boxShadow: isSubmitting ? 'none' : '0 0 20px rgba(124,58,237,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Sign in link */}
      <p className="mt-6 text-center text-xs text-white/35">
        Already registered?{' '}
        <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Sign in
        </Link>
      </p>
    </div>
  );
}
