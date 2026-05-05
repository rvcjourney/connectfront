import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

const BUCKET = 'mentor-videos';

// XHR upload — Supabase JS client v2 + React Native FormData is incompatible (body.has error)
const uploadFileXHR = (storagePath, fileUri, fileName, contentType, token, onProgress) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('', { uri: fileUri, name: fileName, type: contentType });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });

export const videoApi = {
  // ─── Mentor: upload video file to storage + insert record ───────────────────
  uploadVideo: async ({ mentorId, title, description = '', fileUri, fileName, isFree = false, onProgress }) => {
    try {
      const ext = (fileName.split('.').pop() || 'mp4').toLowerCase();
      const contentType = ext === 'mov' ? 'video/quicktime' : `video/${ext}`;
      const storagePath = `${mentorId}/${Date.now()}.${ext}`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      await uploadFileXHR(storagePath, fileUri, fileName, contentType, session.access_token, onProgress);

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const { data, error } = await supabase
        .from('mentor_videos')
        .insert({
          mentor_id: mentorId,
          title,
          description,
          video_url: publicUrl,
          storage_path: storagePath,
          is_free: isFree,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Get all videos for a mentor (ordered by position then created_at) ───────
  getMentorVideos: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('mentor_videos')
        .select('id, title, description, video_url, thumbnail_url, is_free, position, created_at')
        .eq('mentor_id', mentorId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Update video metadata ────────────────────────────────────────────────────
  updateVideo: async ({ id, title, description, isFree, position }) => {
    try {
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (isFree !== undefined) updates.is_free = isFree;
      if (position !== undefined) updates.position = position;

      const { data, error } = await supabase
        .from('mentor_videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Delete video from storage + table ───────────────────────────────────────
  deleteVideo: async ({ id, storagePath }) => {
    try {
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }

      const { error } = await supabase
        .from('mentor_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Check if learner has unlocked a mentor's library ────────────────────────
  checkUnlocked: async ({ learnerId, mentorId }) => {
    try {
      const { data, error } = await supabase
        .from('learner_unlocks')
        .select('id, unlocked_at')
        .eq('learner_id', learnerId)
        .eq('mentor_id', mentorId)
        .maybeSingle();

      if (error) throw error;
      return data !== null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Record unlock after successful Razorpay payment ─────────────────────────
  recordUnlock: async ({ learnerId, mentorId, amountPaid }) => {
    try {
      const { data, error } = await supabase
        .from('learner_unlocks')
        .upsert({ learner_id: learnerId, mentor_id: mentorId, amount_paid: amountPaid })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Set mentor's library unlock price ───────────────────────────────────────
  setUnlockPrice: async ({ mentorId, price }) => {
    try {
      const { error } = await supabase
        .from('mentor_profiles')
        .update({ unlock_price: price })
        .eq('id', mentorId);

      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Get mentor's unlock price ────────────────────────────────────────────────
  getUnlockPrice: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('unlock_price')
        .eq('id', mentorId)
        .single();

      if (error) throw error;
      return data?.unlock_price || 299;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
