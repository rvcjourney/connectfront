import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';
import { cancelSessionReminder } from '../utils/sessionReminder';

export const bookingApi = {
  createBooking: async ({ learnerId, mentorId, slotId, message }) => {
    try {
      // Verify slot is still available before booking
      const { data: slot, error: slotCheckError } = await supabase
        .from('availability_slots')
        .select('is_booked')
        .eq('id', slotId)
        .single();

      if (slotCheckError) throw slotCheckError;
      if (slot?.is_booked) {
        throw new Error('This time slot was just booked by someone else. Please choose a different slot.');
      }

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
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getUpcomingBookingsByLearner: async (learnerId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:mentor_id (id, name, avatar_url),
          availability_slots (date, start_time, end_time)
        `)
        .eq('learner_id', learnerId)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getBookingHistoryByLearner: async (learnerId, page = 0, pageSize = 10) => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:mentor_id (id, name, avatar_url),
          availability_slots (date, start_time, end_time)
        `)
        .eq('learner_id', learnerId)
        .in('status', ['completed', 'cancelled', 'rejected'])
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data || [];
    } catch (error) {
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
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getUpcomingBookingsByMentor: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:learner_id (id, name, avatar_url),
          availability_slots (date, start_time, end_time)
        `)
        .eq('mentor_id', mentorId)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getBookingHistoryByMentor: async (mentorId, page = 0, pageSize = 10) => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:learner_id (id, name, avatar_url),
          availability_slots (date, start_time, end_time)
        `)
        .eq('mentor_id', mentorId)
        .in('status', ['completed', 'cancelled', 'rejected'])
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data || [];
    } catch (error) {
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

      // If status is 'completed':
      // 1. Increment mentor's total_sessions
      // 2. Move earnings from pending → available balance (complete_session_payment RPC)
      if (status === 'completed' && data?.mentor_id) {
        console.log(`✅ Session completed for mentor: ${data.mentor_id}`);

        // Increment total_sessions
        const { data: mentorData, error: fetchError } = await supabase
          .from('mentor_profiles')
          .select('total_sessions')
          .eq('id', data.mentor_id)
          .single();

        if (!fetchError && mentorData) {
          const newCount = (mentorData.total_sessions || 0) + 1;
          await supabase
            .from('mentor_profiles')
            .update({ total_sessions: newCount })
            .eq('id', data.mentor_id);
          console.log(`✅ total_sessions updated to: ${newCount}`);
        }

        // Credit wallet: move pending earnings → available balance
        const { error: walletError } = await supabase.rpc('complete_session_payment', {
          p_booking_id: bookingId,
          p_mentor_id:  data.mentor_id,
        });

        if (walletError) {
          console.error('❌ Failed to credit wallet:', walletError);
        } else {
          console.log(`✅ Wallet credited for booking: ${bookingId}`);
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

  getTransactionsAsMentor: async (mentorId) => {
    try {
      const [{ data, error }, { data: mentorProfile }] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            profiles:learner_id (id, name, avatar_url),
            availability_slots (date, start_time, end_time)
          `)
          .eq('mentor_id', mentorId)
          .order('created_at', { ascending: false }),
        supabase
          .from('mentor_profiles')
          .select('price_per_hour')
          .eq('id', mentorId)
          .single(),
      ]);

      if (error) throw error;
      const price = mentorProfile?.price_per_hour ?? null;
      return (data || []).map(b => ({ ...b, mentor_profiles: { price_per_hour: price } }));
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getTransactionsAsLearner: async (learnerId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:mentor_id (id, name, avatar_url),
          availability_slots (date, start_time, end_time)
        `)
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = data || [];

      // Fetch price for each unique mentor in one query
      const mentorIds = [...new Set(rows.map(b => b.mentor_id).filter(Boolean))];
      let priceMap = {};
      if (mentorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('mentor_profiles')
          .select('id, price_per_hour')
          .in('id', mentorIds);
        (profiles || []).forEach(mp => { priceMap[mp.id] = mp.price_per_hour; });
      }

      return rows.map(b => ({
        ...b,
        mentor_profiles: { price_per_hour: priceMap[b.mentor_id] ?? null },
      }));
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

      // Cancel the scheduled reminder since booking is cancelled
      await cancelSessionReminder(bookingId).catch(() => {});

      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
