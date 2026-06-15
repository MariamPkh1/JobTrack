import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ name, email, password }) => {
    const { data, error } = await signUp(email, password, name);
    if (error) {
      toast.error(error.message);
      return;
    }
    // When email confirmation is on, there's no session yet.
    if (data.session) {
      toast.success('Account created!');
      navigate('/dashboard', { replace: true });
    } else {
      toast.success('Check your email to confirm your account.');
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthShell>
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <h2 className="text-headline-md text-on-surface">Create your account</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Start tracking your job search in minutes
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            id="name"
            label="Full Name"
            icon="person"
            type="text"
            placeholder="Alex Rivera"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name is too short' },
            })}
          />

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
            autoComplete="new-password"
            error={errors.password?.message}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[20px]">
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
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
            )}
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-body-md text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
