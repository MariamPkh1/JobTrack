import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const TYPES = ['Phone', 'Video', 'Onsite', 'Technical', 'Final'];
const OUTCOMES = ['Pending', 'Passed', 'Failed'];

const field =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15';

/** Modal to add an interview stage to an application. */
export default function InterviewModal({ applicationId, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { type: 'Phone', date: '', interviewer: '', outcome: 'Pending', notes: '' },
  });

  const onSubmit = async (values) => {
    const { data, error } = await supabase
      .from('interviews')
      .insert({
        application_id: applicationId,
        type: values.type,
        date: new Date(values.date).toISOString(),
        interviewer: values.interviewer || null,
        outcome: values.outcome,
        notes: values.notes || null,
      })
      .select('*')
      .single();
    if (error) return toast.error(error.message);
    toast.success('Interview stage added');
    onSaved(data);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-headline-sm text-on-surface">Add Interview Stage</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Type
              </label>
              <select className={`${field} appearance-none`} {...register('type')}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Outcome
              </label>
              <select className={`${field} appearance-none`} {...register('outcome')}>
                {OUTCOMES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              className={field}
              {...register('date', { required: 'Date is required' })}
            />
            {errors.date && (
              <p className="mt-1 text-label-sm text-error">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              Interviewer
            </label>
            <input
              className={field}
              placeholder="e.g. Marcus Chen (Recruiter)"
              {...register('interviewer')}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              Notes
            </label>
            <textarea
              rows={3}
              className={`${field} resize-none`}
              placeholder="What to prepare, focus areas, outcome details…"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-label-md font-semibold text-on-primary shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              Add Stage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
