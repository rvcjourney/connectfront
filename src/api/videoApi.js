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

  // ─── Get all public videos across all mentors (for learner feed) ────────────
  getAllPublicVideos: async ({ page = 0, pageSize = 20, excludeMentorId = null } = {}) => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Step 1: fetch videos + profile (direct FK exists: mentor_videos.mentor_id → profiles.id)
      let query = supabase
        .from('mentor_videos')
        .select(`
          id, mentor_id, title, description, video_url, is_free, position, created_at,
          profiles:mentor_id ( id, name, avatar_url )
        `)
        .order('created_at', { ascending: false });

      // filter before paginating
      if (excludeMentorId) query = query.neq('mentor_id', excludeMentorId);

      query = query.range(from, to);

      const { data: videos, error } = await query;

      if (error) throw error;
      if (!videos?.length) return [];

      // Step 2: fetch mentor_profiles for all unique mentor IDs in the result
      const mentorIds = [...new Set(videos.map(v => v.mentor_id))];
      const { data: mentorProfiles } = await supabase
        .from('mentor_profiles')
        .select('id, specialization, unlock_price')
        .in('id', mentorIds);

      // Step 3: merge
      const profileMap = {};
      (mentorProfiles || []).forEach(mp => { profileMap[mp.id] = mp; });

      return videos.map(v => ({
        ...v,
        mentor_profiles: profileMap[v.mentor_id] || { specialization: '', unlock_price: 299 },
      }));
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Get unlocked mentor IDs for a learner (active, non-expired) → Map<mentorId, {expiresAt}>
  getLearnerUnlocks: async (learnerId) => {
    try {
      const { data, error } = await supabase
        .from('learner_unlocks')
        .select('mentor_id, expires_at')
        .eq('learner_id', learnerId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) throw error;
      const map = new Map();
      (data || []).forEach(u => map.set(u.mentor_id, { expiresAt: u.expires_at }));
      return map;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Get full subscription list for a learner (for transaction history) ──────
  getLearnerSubscriptions: async (learnerId) => {
    try {
      // Step 1: fetch unlock records
      const { data: unlocks, error } = await supabase
        .from('learner_unlocks')
        .select('id, mentor_id, amount_paid, unlocked_at, expires_at')
        .eq('learner_id', learnerId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      if (!unlocks?.length) return [];

      // Step 2: fetch mentor profiles for all unique mentor IDs
      const mentorIds = [...new Set(unlocks.map(u => u.mentor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', mentorIds);

      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      return unlocks.map(u => ({
        ...u,
        profiles: profileMap[u.mentor_id] || null,
      }));
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  // ─── Create Razorpay order for video subscription ─────────────────────────
  createVideoOrder: async ({ mentorId, learnerId, amountPaise }) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-video-order`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey':        SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ mentorId, learnerId, amountPaise }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(JSON.parse(text)?.error || 'Order creation failed');
      return JSON.parse(text);
    } catch (error) {
      throw new Error(error.message || 'Failed to create order');
    }
  },

  // ─── Verify payment + record subscription server-side ────────────────────
  verifyVideoSubscription: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature, mentorId, learnerId, amountPaid, mentorAmount }) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-video-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey':        SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature, mentorId, learnerId, amountPaid, mentorAmount }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(JSON.parse(text)?.error || 'Verification failed');
      return JSON.parse(text);
    } catch (error) {
      throw new Error(error.message || 'Payment verification failed');
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
        .upsert({ learner_id: learnerId, mentor_id: mentorId, amount_paid: amountPaid }, { onConflict: 'learner_id,mentor_id' })
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
