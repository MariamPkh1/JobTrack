import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Always show success — don't reveal whether an account exists.
    setSent(true);
  };

  return (
    <AuthShell>
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed">
              <span className="material-symbols-outlined text-[28px] leading-none text-primary [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_24]">
                mark_email_read
              </span>
            </div>
            <h2 className="text-headline-md text-on-surface">Check your email</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              If an account exists for{' '}
              <span className="font-medium text-on-surface">{getValues('email')}</span>, we've
              sent a link to reset your password. It expires in 1 hour.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-1.5 text-label-md font-semibold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[18px] leading-none [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
                arrow_back
              </span>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-headline-md text-on-surface">Forgot password?</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Enter your email and we'll send you a link to reset it.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <FormField
                id="email"
                label="Email Address"
                icon="mail"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting && (
                  <span className="material-symbols-outlined animate-spin text-[20px] leading-none [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
                    progress_activity
                  </span>
                )}
                Send reset link
              </button>
            </form>

            <p className="mt-6 text-center text-body-md text-on-surface-variant">
              Remembered it?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
