import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

/** Satisfies NOT NULL on recordings.recording_url until VideoSDK returns a real URL. */
export const RECORDING_URL_PLACEHOLDER = 'pending';

export function pickRecordingRow(booking) {
  const r = booking?.recordings;
  if (Array.isArray(r)) return r[0] ?? null;
  if (r && typeof r === 'object') return r;
  return null;
}

export function meetingIdFromBooking(booking) {
  return pickRecordingRow(booking)?.meeting_id ?? null;
}

/** Public playback/file URL for UI (ignores placeholder rows). */
export function playbackUrlFromBooking(booking) {
  const row = pickRecordingRow(booking);
  if (!row) return null;
  const u = row.recording_playback_url || row.recording_url;
  if (!u || u === RECORDING_URL_PLACEHOLDER) return null;
  return u;
}

export const recordingsApi = {
  /**
   * Create or replace the session row for a booking (host stores VideoSDK room id here).
   */
  upsertSessionForBooking: async ({ bookingId, mentorId, learnerId, meetingId }) => {
    try {
      const { error } = await supabase.from('recordings').upsert(
        {
          booking_id: bookingId,
          mentor_id: mentorId,
          learner_id: learnerId,
          meeting_id: meetingId ?? null,
          recording_url: RECORDING_URL_PLACEHOLDER,
          recording_playback_url: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'booking_id' },
      );
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateRecordingUrls: async ({ bookingId, recordingUrl, recordingPlaybackUrl }) => {
    try {
      const url = recordingUrl || RECORDING_URL_PLACEHOLDER;
      const { error } = await supabase
        .from('recordings')
        .update({
          recording_url: url,
          recording_playback_url: recordingPlaybackUrl ?? recordingUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  clearMeetingForBooking: async bookingId => {
    try {
      const { error } = await supabase
        .from('recordings')
        .update({ meeting_id: null, updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
