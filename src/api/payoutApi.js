import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

async function invokeFunction(name, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Function error (${res.status}): ${text}`);
  return JSON.parse(text);
}

export const payoutApi = {
  createLinkedAccount: async ({ mentorId, legalName, email, upiId }) => {
    try {
      return await invokeFunction('create-linked-account', { mentorId, legalName, email, upiId });
    } catch (error) {
      throw new Error(error.message || 'Failed to create payout account');
    }
  },

  getAccountStatus: async (mentorId) => {
    try {
      return await invokeFunction('get-account-status', { mentorId });
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch account status');
    }
  },
};
