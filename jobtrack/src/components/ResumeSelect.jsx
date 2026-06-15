import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/** Custom resume picker: lists the user's resumes (from the `resumes` table)
 *  and lets them upload a new PDF straight into their own storage folder.
 *  `value` is a resume_id (or null); `onChange(id)` reports the selection. */
export default function ResumeSelect({ value, onChange }) {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from('resumes')
      .select('id, resume_name, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        if (active) setResumes(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const selected = resumes.find((r) => r.id === value);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      // Folder-per-user path — the storage RLS policy requires the first path
      // segment to be the owner's auth ID.
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('resumes')
        .upload(path, file, { contentType: 'application/pdf' });
      if (upErr) throw upErr;

      // Store the pointer (path) + metadata in the resumes table.
      const { data: row, error: insErr } = await supabase
        .from('resumes')
        .insert({ user_id: user.id, file_url: path, resume_name: file.name })
        .select('id, resume_name, uploaded_at')
        .single();
      if (insErr) throw insErr;

      setResumes((prev) => [row, ...prev]);
      onChange(row.id);
      setOpen(false);
      toast.success('Resume uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md shadow-sm transition-all hover:bg-surface-container-low"
      >
        <span className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">
            description
          </span>
          <span className={selected ? 'text-on-surface' : 'text-on-surface-variant'}>
            {uploading
              ? 'Uploading…'
              : selected
                ? selected.resume_name
                : 'Select a resume…'}
          </span>
        </span>
        <span
          className={`material-symbols-outlined text-outline transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest py-2 shadow-lg">
          {resumes.length > 0 && (
            <p className="px-4 py-2 text-label-sm uppercase tracking-wider text-outline">
              Your resumes
            </p>
          )}
          {resumes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onChange(r.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-md text-on-surface hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                picture_as_pdf
              </span>
              <span className="flex-1 truncate">{r.resume_name}</span>
              {r.id === value && (
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  check
                </span>
              )}
            </button>
          ))}

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-md text-on-surface-variant hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">block</span>
              No resume
            </button>
          )}

          <div className="my-1 h-px bg-outline-variant" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-label-md font-medium text-primary hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[20px]">
              upload_file
            </span>
            Upload new resume
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
