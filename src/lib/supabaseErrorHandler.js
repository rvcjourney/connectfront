export const getSupabaseErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';

  const message = error.message || '';
  const code = error.code || '';

  // Auth errors
  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password';
  }
  if (message.includes('User already registered')) {
    return 'This email is already registered. Try signing in instead.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email to confirm your account';
  }
  if (code === 'PGRST301') {
    return 'Your session has expired. Please sign in again.';
  }

  // Database errors
  if (code === '23505') {
    return 'This record already exists';
  }
  if (code === '23502') {
    return 'A required field is missing';
  }
  if (code === '42P01') {
    return 'Database table not found';
  }

  // Network errors
  if (message.includes('Network request failed')) {
    return 'Network error. Please check your connection.';
  }

  return message || 'Something went wrong. Please try again.';
};
