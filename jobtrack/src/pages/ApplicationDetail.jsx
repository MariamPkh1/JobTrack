import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { STATUSES, STATUS_BADGE, STATUS_DOT } from '../lib/statusConfig';
import InterviewModal from '../components/InterviewModal';

const fmtDate = (d, opts) => (d ? new Date(d).toLocaleDateString(undefined, opts) : '—');

// Captured once at load — used only to label stages past/upcoming.
const LOADED_AT = Date.now();

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [resume, setResume] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*, resume:resumes(id, resume_name, file_url, uploaded_at)')
        .eq('id', id)
        .single();
      if (!active) return;
      if (error || !data) {
        toast.error('Application not found');
        navigate('/applications', { replace: true });
        return;
      }
      setApp(data);
      setResume(data.resume ?? null);

      const { data: ints } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', id)
        .order('date', { ascending: true });
      if (!active) return;
      setInterviews(ints ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const changeStatus = async (status) => {
    const prev = app.status;
    setApp((a) => ({ ...a, status }));
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (error) {
      setApp((a) => ({ ...a, status: prev }));
      toast.error(error.message);
    } else {
      toast.success(`Status set to ${status}`);
    }
  };

  const viewResume = async () => {
    if (!resume) return;
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resume.file_url, 3600);
    if (error || !data?.signedUrl) return toast.error('Could not open resume');
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const deleteInterview = async (interviewId) => {
    if (!window.confirm('Remove this interview stage?')) return;
    const { error } = await supabase.from('interviews').delete().eq('id', interviewId);
    if (error) return toast.error(error.message);
    setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    toast.success('Stage removed');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-stack-lg" style={{ zoom: 1 }}>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-label-md text-on-surface-variant">
        <Link to="/applications" className="hover:text-primary">
          Applications
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface">
          {app.company_name} · {app.position}
        </span>
      </nav>

      {/* Header card */}
      <div className="mb-stack-md flex flex-wrap items-start justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[28px]">work</span>
          </div>
          <div>
            <h2 className="text-headline-md text-on-surface">{app.position}</h2>
            <p className="text-body-md text-on-surface-variant">
              <span className="font-semibold text-primary">{app.company_name}</span>
              {'  ·  Applied '}
              {fmtDate(app.applied_date, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusSelect value={app.status} onChange={changeStatus} />
          <Link
            to={`/applications/${id}/edit`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            title="Edit application"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </Link>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card>
            <CardTitle icon="info">Application Details</CardTitle>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Detail label="Job URL">
                {app.job_url ? (
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <span className="truncate">{app.job_url.replace(/^https?:\/\//, '')}</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                ) : (
                  '—'
                )}
              </Detail>
              <Detail label="Salary Range">{app.salary_range || '—'}</Detail>
              <Detail label="Location">{app.location || '—'}</Detail>
              <Detail label="Status">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_DOT[app.status] }}
                  />
                  {app.status}
                </span>
              </Detail>
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle icon="sticky_note_2">Application Notes</CardTitle>
              <Link
                to={`/applications/${id}/edit`}
                className="text-label-md font-medium text-primary hover:underline"
              >
                Edit Notes
              </Link>
            </div>
            {app.notes ? (
              <p className="rounded-lg bg-surface-container-low p-4 text-body-md italic leading-relaxed text-on-surface-variant">
                {app.notes}
              </p>
            ) : (
              <p className="text-body-md text-on-surface-variant">No notes yet.</p>
            )}
          </Card>
        </div>

        {/* Resume rail */}
        <div className="space-y-6">
          <Card>
            <CardTitle icon="description">Resume Sent</CardTitle>
            {resume ? (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
                  <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                  <div className="min-w-0">
                    <p className="truncate text-label-md font-semibold text-on-surface">
                      {resume.resume_name}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      Uploaded {fmtDate(resume.uploaded_at, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={viewResume}
                    className="flex-1 rounded-lg bg-primary py-2 text-label-md font-semibold text-on-primary hover:opacity-90"
                  >
                    View
                  </button>
                  <Link
                    to={`/applications/${id}/edit`}
                    className="flex-1 rounded-lg border border-outline-variant py-2 text-center text-label-md font-medium text-on-surface-variant hover:bg-surface-container-low"
                  >
                    Change
                  </Link>
                </div>
              </>
            ) : (
              <Link
                to={`/applications/${id}/edit`}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant py-4 text-label-md text-primary hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                Attach a resume
              </Link>
            )}
          </Card>
        </div>
      </div>

      {/* Interview timeline */}
      <div className="mt-stack-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-headline-sm text-on-surface">
            <span className="material-symbols-outlined text-primary">event</span>
            Interview Timeline
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-label-md font-medium text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Add Stage
          </button>
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {interviews.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} jobUrl={app.job_url} onDelete={deleteInterview} />
          ))}

          <button
            onClick={() => setShowModal(true)}
            className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-3xl">add</span>
            <span className="text-label-md font-medium">Add Interview Stage</span>
            <span className="text-label-sm">Track your progress</span>
          </button>
        </div>
      </div>

      {showModal && (
        <InterviewModal
          applicationId={id}
          onClose={() => setShowModal(false)}
          onSaved={(iv) => {
            setInterviews((prev) =>
              [...prev, iv].sort((a, b) => new Date(a.date) - new Date(b.date))
            );
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ── small building blocks ── */

function Card({ children }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      {children}
    </div>
  );
}

function CardTitle({ icon, children }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-label-md font-semibold text-on-surface">
      <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
      {children}
    </h3>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <div className="text-body-md text-on-surface">{children}</div>
    </div>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer appearance-none rounded-full py-1.5 pl-3 pr-8 text-label-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 ${STATUS_BADGE[value]}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-surface-container-lowest text-on-surface">
            {s}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[18px]">
        expand_more
      </span>
    </div>
  );
}

function InterviewCard({ iv, jobUrl, onDelete }) {
  const dt = new Date(iv.date);
  const isPast = dt.getTime() < LOADED_AT;
  const timeBadge = isPast
    ? { label: 'Completed', cls: 'bg-secondary/10 text-secondary' }
    : { label: 'Upcoming', cls: 'bg-primary/10 text-primary' };
  const accent = isPast ? '#006c49' : '#0058be';

  return (
    <div
      className="group relative rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <button
        onClick={() => onDelete(iv.id)}
        className="absolute right-3 top-3 rounded-lg p-1 text-on-surface-variant opacity-0 transition-opacity hover:bg-error/10 hover:text-error group-hover:opacity-100"
        title="Remove stage"
      >
        <span className="material-symbols-outlined text-[18px]">delete</span>
      </button>

      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-label-md font-bold text-on-surface">{iv.type} Interview</h4>
        <span className={`rounded-full px-2 py-0.5 text-label-sm font-semibold ${timeBadge.cls}`}>
          {timeBadge.label}
        </span>
      </div>

      <p className="mb-3 text-label-md text-on-surface-variant">
        {dt.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </p>

      {iv.interviewer && (
        <p className="mb-3 flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">person</span>
          {iv.interviewer}
        </p>
      )}

      {iv.notes && (
        <p className="rounded-lg bg-surface-container-low p-3 text-label-md italic text-on-surface-variant">
          {iv.notes}
        </p>
      )}

      {!isPast && jobUrl && (
        <a
          href={jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-outline-variant py-2 text-label-md font-medium text-primary hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[18px]">videocam</span>
          Join Meeting
        </a>
      )}
    </div>
  );
}
