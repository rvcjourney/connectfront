import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const availabilityApi = {
  getAvailabilityForMentor: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('id, date, start_time, end_time, is_booked')
        .eq('mentor_id', mentorId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getAvailableSlots: async ({ mentorId, date }) => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('id, date, start_time, end_time')
        .eq('mentor_id', mentorId)
        .eq('date', date)
        .eq('is_booked', false)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  addAvailabilitySlot: async ({ mentorId, date, startTime, endTime }) => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .insert([
          {
            mentor_id: mentorId,
            date,
            start_time: startTime,
            end_time: endTime,
            is_booked: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  deleteAvailabilitySlot: async (mentorId) => {
    try {
      // Only delete unbooked slots to prevent foreign key violation
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('mentor_id', mentorId)
        .eq('is_booked', false);

      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  markSlotBooked: async (slotId) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', slotId);

      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  markSlotAvailable: async (slotId) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('id', slotId);

      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
