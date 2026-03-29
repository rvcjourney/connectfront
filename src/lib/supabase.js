import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pkoaxfxejgaawtwnkhvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb2F4ZnhlamdhYXd0d25raHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDcxMTcsImV4cCI6MjA4OTQyMzExN30.xzMh8CqUzQ9MEcSQbfTfr-VLxJxXdfyMcebrjQ4tWXQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
