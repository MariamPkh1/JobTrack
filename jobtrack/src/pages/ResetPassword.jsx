import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const { updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  // 'checking' → 'ready' (valid recovery session) → or 'invalid' link.
  const [status, setStatus] = useState('checking');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    // supabase-js parses the recovery token from the URL hash and fires
    // PASSWORD_RECOVERY. We also check for an already-established session in
    // case that event fired before this component mounted.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setStatus('ready');
    });

    supabase.auth.getSession().then(({ data }) => {
      setStatus((s) => (data.session ? 'ready' : s === 'ready' ? 'ready' : 'invalid'));
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async ({ password }) => {
    const { error } = await updatePassword(password);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Password updated — please sign in.');
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <AuthShell>
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        {status === 'invalid' ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-error-container">
              <span className="material-symbols-outlined text-[28px] leading-none text-error [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_24]">
                link_off
              </span>
            </div>
            <h2 className="text-headline-md text-on-surface">Link expired or invalid</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              This password reset link is no longer valid. Request a new one to continue.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex items-center gap-1.5 text-label-md font-semibold text-primary hover:underline"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-headline-md text-on-surface">Set a new password</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Choose a strong password you don't use elsewhere.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <FormField
                id="password"
                label="New Password"
                icon="lock"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.password?.message}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:text-primary"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[20px] leading-none [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                }
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />

              <FormField
                id="confirmPassword"
                label="Confirm Password"
                icon="lock"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === getValues('password') || 'Passwords do not match',
                })}
              />

              <button
                type="submit"
                disabled={isSubmitting || status !== 'ready'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting && (
                  <span className="material-symbols-outlined animate-spin text-[20px] leading-none [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
                    progress_activity
                  </span>
                )}
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  );
}
