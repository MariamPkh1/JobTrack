import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadResume, resumeSignedUrl, deleteResume } from '../lib/resumes';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [prof, res, ap, iv] = await Promise.all([
        supabase.from('profiles').select('name, email, avatar_url').eq('id', user.id).single(),
        supabase.from('resumes').select('id, resume_name, file_url, uploaded_at').order('uploaded_at', { ascending: false }),
        supabase.from('applications').select('applied_date'),
        supabase.from('interviews').select('date'),
      ]);
      if (!active) return;
      setProfile(prof.data ?? { name: '', email: user.email });
      setResumes(res.data ?? []);
      setApps(ap.data ?? []);
      setInterviews(iv.data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const displayName =
    profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  const initials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const activity = useMemo(() => {
    const year = new Date().getFullYear();
    const buckets = MONTHS.map((m) => ({ month: m, Applications: 0, Interviews: 0 }));
    apps.forEach((a) => {
      const d = a.applied_date && new Date(a.applied_date);
      if (d && d.getFullYear() === year) buckets[d.getMonth()].Applications += 1;
    });
    interviews.forEach((i) => {
      const d = i.date && new Date(i.date);
      if (d && d.getFullYear() === year) buckets[d.getMonth()].Interviews += 1;
    });
    return buckets;
  }, [apps, interviews]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const row = await uploadResume(user.id, file);
      setResumes((prev) => [row, ...prev]);
      toast.success('Resume uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleView = async (resume, download = false) => {
    try {
      const url = await resumeSignedUrl(resume.file_url, { download });
      window.open(url, '_blank', 'noopener');
    } catch {
      toast.error('Could not open file');
    }
  };

  const handleDelete = async (resume) => {
    if (!window.confirm(`Delete ${resume.resume_name}?`)) return;
    try {
      await deleteResume(resume);
      setResumes((prev) => prev.filter((r) => r.id !== resume.id));
      toast.success('Resume deleted');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleDeleteAccount = async () => {
    // Storage objects don't cascade with the auth user — clear the user's
    // resume files first (best effort), then delete the account via RPC.
    const paths = resumes.map((r) => r.file_url).filter(Boolean);
    if (paths.length) {
      await supabase.storage.from('resumes').remove(paths);
    }
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    await signOut();
    navigate('/login', { replace: true });
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
    <div className="p-stack-lg" style={{ zoom: 1 }}>
      <h2 className="mb-stack-md text-headline-md text-on-surface">User Profile</h2>

      {/* Identity card */}
      <div className="mb-10 flex flex-col items-start justify-between gap-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-primary text-display-lg font-semibold text-on-primary">
            {initials}
          </div>
          <div>
            <h3 className="text-headline-md text-on-surface">{displayName}</h3>
            <p className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              {profile?.email || user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-6 py-2.5 text-label-md font-medium text-on-surface transition-all hover:bg-surface-container-high active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Edit Profile
        </button>
      </div>

      {/* Resumes */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h3 className="text-headline-sm text-on-surface">My Resumes</h3>
            <p className="text-body-md text-on-surface-variant">
              Manage and organize your uploaded resume files.
            </p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-label-md font-medium text-primary transition-colors hover:bg-primary-fixed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {uploading ? 'Uploading…' : 'Upload New'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r, idx) => (
            <div
              key={r.id}
              className="group rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-primary-fixed p-3">
                  <span className="material-symbols-outlined text-[32px] text-primary">
                    description
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconBtn icon="visibility" title="View" onClick={() => handleView(r)} />
                  <IconBtn icon="download" title="Download" onClick={() => handleView(r, true)} />
                  <IconBtn
                    icon="delete"
                    title="Delete"
                    danger
                    onClick={() => handleDelete(r)}
                  />
                </div>
              </div>
              <h4 className="mb-1 truncate text-label-md font-medium text-on-surface">
                {r.resume_name}
              </h4>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-label-sm text-on-surface-variant opacity-70">
                  Uploaded{' '}
                  {new Date(r.uploaded_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {idx === 0 && (
                  <span className="rounded bg-surface-container px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Latest
                  </span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant p-5 transition-all duration-300 hover:border-primary hover:bg-surface-container-low disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container transition-colors group-hover:bg-primary-fixed">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">
                add
              </span>
            </div>
            <span className="text-label-md font-medium text-on-surface-variant">
              {resumes.length === 0 ? 'Upload your first resume' : 'Upload another version'}
            </span>
          </button>
        </div>
      </section>

      {/* Activity + Next steps */}
      <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-8 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-headline-sm text-on-surface">Application Activity</h4>
            <div className="flex gap-4">
              <Legend color="#006c49" label="Applications" />
              <Legend color="#0058be" label="Interviews" />
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#424754', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,88,190,0.06)' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #c2c6d6', fontSize: 12 }}
                />
                <Bar dataKey="Applications" fill="#006c49" radius={[6, 6, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Interviews" fill="#0058be" radius={[6, 6, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-primary p-8 text-on-primary">
          <div>
            <h4 className="mb-2 text-headline-sm">Next Steps</h4>
            <p className="mb-6 text-body-md opacity-80">
              Complete your profile to increase visibility by 40%.
            </p>
          </div>
          <ul className="space-y-4">
            <Step done={resumes.length > 0} label="Upload Resume" />
            <Step done={Boolean(profile?.name)} label="Add your name" />
            <Step done={apps.length > 0} label="Add your first application" />
          </ul>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-8 rounded-lg bg-on-primary py-3 text-label-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
          >
            Finish Setup
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="mt-12 rounded-xl border border-error/40 bg-error-container/30 p-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h4 className="flex items-center gap-2 text-headline-sm text-error">
              <span className="material-symbols-outlined text-[22px] leading-none [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_24]">
                warning
              </span>
              Delete account
            </h4>
            <p className="mt-1 max-w-xl text-body-md text-on-surface-variant">
              Permanently delete your account, resumes, applications, and interviews.
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setDeleting(true)}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-error bg-surface-container-lowest px-6 py-2.5 text-label-md font-semibold text-error transition-all hover:bg-error hover:text-on-error active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] leading-none [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
              delete_forever
            </span>
            Delete Account
          </button>
        </div>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {deleting && (
        <DeleteAccountModal
          email={profile?.email || user?.email}
          onClose={() => setDeleting(false)}
          onConfirm={handleDeleteAccount}
        />
      )}

      {editing && (
        <EditProfileModal
          userId={user.id}
          current={profile}
          onClose={() => setEditing(false)}
          onSaved={(name) => {
            setProfile((p) => ({ ...p, name }));
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function IconBtn({ icon, title, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md p-2 text-on-surface-variant transition-colors ${
        danger
          ? 'hover:bg-error-container hover:text-error'
          : 'hover:bg-surface-container hover:text-primary'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Step({ done, label }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="material-symbols-outlined text-[20px]"
        style={done ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {done ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      <span className={`text-label-md ${done ? '' : 'opacity-80'}`}>{label}</span>
    </li>
  );
}

function DeleteAccountModal({ email, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  const handleConfirm = async () => {
    if (!canDelete || busy) return;
    setBusy(true);
    try {
      await onConfirm();
      // On success we redirect away, so no need to reset state.
    } catch (err) {
      toast.error(err.message || 'Could not delete account');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/30 p-4 backdrop-blur-sm"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-container">
            <span className="material-symbols-outlined text-[24px] leading-none text-error [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_24]">
              warning
            </span>
          </div>
          <div>
            <h3 className="text-headline-sm text-on-surface">Delete account</h3>
            <p className="mt-1 text-body-md text-on-surface-variant">
              This permanently deletes <span className="font-medium text-on-surface">{email}</span>{' '}
              and all associated data. This cannot be undone.
            </p>
          </div>
        </div>

        <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
          Type <span className="font-semibold text-error">DELETE</span> to confirm
        </label>
        <input
          autoFocus
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md shadow-sm focus:border-error focus:outline-none focus:ring-[3px] focus:ring-error/15"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canDelete || busy}
            className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-label-md font-semibold text-on-error shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {busy && (
              <span className="material-symbols-outlined animate-spin text-[18px] leading-none [font-variation-settings:'FILL'_0,'wght'_400,'GRAD'_0,'opsz'_20]">
                progress_activity
              </span>
            )}
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({ userId, current, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { name: current?.name || '' } });

  const onSubmit = async ({ name }) => {
    const { error } = await supabase.from('profiles').update({ name }).eq('id', userId);
    if (error) return toast.error(error.message);
    toast.success('Profile updated');
    onSaved(name);
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
          <h3 className="text-headline-sm text-on-surface">Edit Profile</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              Full Name
            </label>
            <input
              autoFocus
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md shadow-sm focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              placeholder="Your name"
              {...register('name')}
            />
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Email is managed by your account and can't be changed here.
          </p>
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
