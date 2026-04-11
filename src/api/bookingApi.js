import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const bookingApi = {
  createBooking: async ({ learnerId, mentorId, slotId, message }) => {
    try {
      // Create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            learner_id: learnerId,
            mentor_id: mentorId,
            slot_id: slotId,
            message: message || null,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Mark the availability slot as booked
      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', slotId);

      if (slotError) throw slotError;

      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getBooking: async (bookingId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!learner_id (
            name,
            avatar_url
          ),
          availability_slots (
            date,
            start_time,
            end_time
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getBookingsByLearner: async (learnerId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:mentor_id (
            id,
            name,
            avatar_url
          ),
          availability_slots (
            date,
            start_time,
            end_time
          )
        `)
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📚 Learner bookings:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to load learner bookings:', error);
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getBookingsByMentor: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:learner_id (
            id,
            name,
            avatar_url
          ),
          availability_slots (
            date,
            start_time,
            end_time
          )
        `)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📞 Mentor bookings:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to load mentor bookings:', error);
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateBookingStatus: async ({ bookingId, status }) => {
    try {
      console.log(`📊 Updating booking ${bookingId} status to: ${status}`);

      // Update the booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // If status is 'completed', increment mentor's total_sessions
      if (status === 'completed' && data?.mentor_id) {
        console.log(`✅ Session completed! Incrementing total_sessions for mentor: ${data.mentor_id}`);

        // Get current count and increment by 1
        const { data: mentorData, error: fetchError } = await supabase
          .from('mentor_profiles')
          .select('total_sessions')
          .eq('id', data.mentor_id)
          .single();

        if (!fetchError && mentorData) {
          const newCount = (mentorData.total_sessions || 0) + 1;
          const { error: incrementError } = await supabase
            .from('mentor_profiles')
            .update({ total_sessions: newCount })
            .eq('id', data.mentor_id);

          if (incrementError) {
            console.error('❌ Failed to increment total_sessions:', incrementError);
          } else {
            console.log(`✅ Mentor total_sessions updated to: ${newCount}`);
          }
        }
      }

      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setMeetingId: async ({ bookingId, meetingId }) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ meeting_id: meetingId })
        .eq('id', bookingId);

      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  clearMeetingId: async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ meeting_id: null })
        .eq('id', bookingId);

      if (error) throw error;
      console.log('✅ Meeting ID cleared - meeting abandoned');
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setRecordingLinks: async ({ bookingId, recordingUrl, recordingPlaybackUrl }) => {
    try {
      const payload = {
        recording_url: recordingUrl || null,
        recording_playback_url: recordingPlaybackUrl || recordingUrl || null,
      };

      const { error } = await supabase
        .from('bookings')
        .update(payload)
        .eq('id', bookingId);

      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      // Get the booking to find the slot
      const booking = await bookingApi.getBooking(bookingId);

      // Mark slot as available again
      await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('id', booking.slot_id);

      // Update booking status
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
