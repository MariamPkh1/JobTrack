import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Welcome back!');
    navigate(from, { replace: true });
  };

  return (
    <AuthShell>
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <h2 className="text-headline-md text-on-surface">Welcome back</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Enter your credentials to access your dashboard
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

          <FormField
            id="password"
            label="Password"
            icon="lock"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
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
            {...register('password', { required: 'Password is required' })}
          />

          <div className="-mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-label-md font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

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
            Sign In
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-label-sm text-on-surface-variant">
          <div className="h-px flex-1 bg-outline-variant" />
          Or continue with
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest py-2.5 text-label-md font-medium text-on-surface transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[18px] leading-none text-error [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
              alternate_email
            </span>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest py-2.5 text-label-md font-medium text-on-surface transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[18px] leading-none text-primary [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
              link
            </span>
            LinkedIn
          </button>
        </div>

        <p className="mt-6 text-center text-body-md text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
