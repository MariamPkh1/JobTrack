import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { STATUSES, PRIORITIES } from '../lib/statusConfig';
import ResumeSelect from '../components/ResumeSelect';
import LoadingScreen from '../components/LoadingScreen';

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15';

function Label({ children }) {
  return (
    <label className="mb-2 block text-label-md font-medium text-on-surface-variant">
      {children}
    </label>
  );
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-8 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

/** Chip-style tag editor. Commits a tag on Enter or comma; backspace on an
 *  empty field removes the last chip. Stores a string[] via `onChange`. */
function TagsInput({ value = [], onChange }) {
  const [draft, setDraft] = useState('');

  const addTag = (raw) => {
    const tag = raw.trim().replace(/,+$/, '');
    if (!tag) return;
    if (!value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft('');
  };

  const removeTag = (idx) => onChange(value.filter((_, i) => i !== idx));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-sm transition-all focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15">
      {value.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-label-sm font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(idx)}
            className="flex items-center text-primary/70 hover:text-primary"
            aria-label={`Remove ${tag}`}
          >
            <span className="material-symbols-outlined text-[16px] leading-none">close</span>
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={value.length ? 'Add another…' : 'e.g. Remote, Referral, Dream Job'}
        className="min-w-[8rem] flex-1 bg-transparent py-1 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
      />
    </div>
  );
}

export default function ApplicationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      company_name: '',
      position: '',
      job_url: '',
      location: '',
      salary_range: '',
      job_description: '',
      notes: '',
      status: 'Applied',
      priority: 'Medium',
      tags: [],
      applied_date: today(),
      resume_id: null,
    },
  });

  // Load existing record in edit mode.
  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          toast.error('Application not found');
          navigate('/applications', { replace: true });
          return;
        }
        reset({
          company_name: data.company_name ?? '',
          position: data.position ?? '',
          job_url: data.job_url ?? '',
          location: data.location ?? '',
          salary_range: data.salary_range ?? '',
          job_description: data.job_description ?? '',
          notes: data.notes ?? '',
          status: data.status ?? 'Applied',
          priority: data.priority ?? 'Medium',
          tags: data.tags ?? [],
          applied_date: data.applied_date ?? today(),
          resume_id: data.resume_id ?? null,
        });
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isEdit, navigate, reset]);

  const onSubmit = async (values) => {
    // Normalize empty optional strings to null so the DB stays clean.
    const payload = {
      ...values,
      job_url: values.job_url || null,
      location: values.location || null,
      salary_range: values.salary_range || null,
      job_description: values.job_description || null,
      notes: values.notes || null,
      resume_id: values.resume_id || null,
      tags: values.tags ?? [],
    };

    if (isEdit) {
      const { error } = await supabase
        .from('applications')
        .update(payload)
        .eq('id', id);
      if (error) return toast.error(error.message);
      toast.success('Application updated');
    } else {
      const { error } = await supabase
        .from('applications')
        .insert({ ...payload, user_id: user.id });
      if (error) return toast.error(error.message);
      toast.success('Application added');
    }
    navigate('/applications');
  };

  if (loading) {
    return <LoadingScreen inline />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-5xl px-4 py-8 sm:px-container-padding sm:py-10"
      style={{ zoom: 1 }}
    >
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-display-lg text-on-surface">
            {isEdit ? 'Edit Application' : 'New Application'}
          </h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            Track your progress and stay organized throughout the hiring cycle.
          </p>
        </div>
        <div className="flex shrink-0 gap-4">
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="rounded-lg border border-outline-variant px-6 py-2.5 text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
            )}
            Save Application
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
              <div>
                <Label>Company Name</Label>
                <input
                  className={inputClass}
                  placeholder="e.g. Google, Stripe"
                  {...register('company_name', {
                    required: 'Company name is required',
                  })}
                />
                {errors.company_name && (
                  <p className="mt-1.5 text-label-sm text-error">
                    {errors.company_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Position</Label>
                <input
                  className={inputClass}
                  placeholder="e.g. Senior UI Designer"
                  {...register('position', {
                    required: 'Position is required',
                  })}
                />
                {errors.position && (
                  <p className="mt-1.5 text-label-sm text-error">
                    {errors.position.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Job URL</Label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline">
                    link
                  </span>
                  <input
                    type="url"
                    className={`${inputClass} pl-12`}
                    placeholder="https://linkedin.com/jobs/..."
                    {...register('job_url')}
                  />
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline">
                    location_on
                  </span>
                  <input
                    className={`${inputClass} pl-12`}
                    placeholder="e.g. Remote, New York"
                    {...register('location')}
                  />
                </div>
              </div>

              <div>
                <Label>Salary Range</Label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline">
                    payments
                  </span>
                  <input
                    className={`${inputClass} pl-12`}
                    placeholder="e.g. $120k - $150k"
                    {...register('salary_range')}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Tags</Label>
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <TagsInput value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card>
            <Label>Job Description</Label>
            <textarea
              rows={8}
              className={`${inputClass} resize-y`}
              placeholder="Paste the full job description here. JobTrack uses it to map the skills this role needs to your career graph."
              {...register('job_description')}
            />
            <p className="mt-2 text-label-sm text-on-surface-variant">
              Paste the full posting — the more complete, the better the skill matching.
            </p>
          </Card>

          <Card>
            <Label>Notes</Label>
            <textarea
              rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Add details about the interview process, company culture, or key requirements..."
              {...register('notes')}
            />
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="space-y-6">
            <div>
              <Label>Status</Label>
              <select
                className={`${inputClass} appearance-none`}
                {...register('status')}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select
                className={`${inputClass} appearance-none`}
                {...register('priority')}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Applied Date</Label>
              <input
                type="date"
                className={inputClass}
                {...register('applied_date', {
                  required: 'Applied date is required',
                })}
              />
              {errors.applied_date && (
                <p className="mt-1.5 text-label-sm text-error">
                  {errors.applied_date.message}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <Label>Resume Sent</Label>
            <Controller
              control={control}
              name="resume_id"
              render={({ field }) => (
                <ResumeSelect value={field.value} onChange={field.onChange} />
              )}
            />
          </Card>

          {/* Pro tip */}
          <div className="group relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary shadow-lg">
            <div className="relative z-10">
              <h4 className="mb-2 text-headline-sm">Pro Tip</h4>
              <p className="text-body-md opacity-90">
                Adding a Salary Range helps JobTrack calculate your potential
                career worth and negotiation power.
              </p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] opacity-10 transition-transform duration-500 group-hover:scale-110">
              trending_up
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
