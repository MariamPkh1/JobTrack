import { supabase } from './supabase';

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB

/** Upload a PDF into the user's own storage folder and record it in `resumes`.
 *  Returns the new resume row. Throws on validation/storage/db error. */
export async function uploadResume(userId, file) {
  if (file.type !== 'application/pdf') throw new Error('Please upload a PDF file.');
  if (file.size > MAX_RESUME_BYTES) throw new Error('File must be under 5MB.');

  // Folder-per-user path — required by the storage RLS policy.
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage
    .from('resumes')
    .upload(path, file, { contentType: 'application/pdf' });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from('resumes')
    .insert({ user_id: userId, file_url: path, resume_name: file.name })
    .select('id, resume_name, file_url, uploaded_at')
    .single();
  if (error) throw error;
  return data;
}

/** Short-lived signed URL for a private resume file. */
export async function resumeSignedUrl(path, { download = false } = {}) {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(path, 3600, { download });
  if (error || !data?.signedUrl) throw error || new Error('Could not open file');
  return data.signedUrl;
}

/** Remove the storage object and the DB row. */
export async function deleteResume(resume) {
  // Remove the file first; the row carries the path we need.
  await supabase.storage.from('resumes').remove([resume.file_url]);
  const { error } = await supabase.from('resumes').delete().eq('id', resume.id);
  if (error) throw error;
}
