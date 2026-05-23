import { supabase } from '../lib/supabase';

export async function registerFcmToken(userId) {
  try {
    const {
      getMessaging,
      requestPermission,
      AuthorizationStatus,
      getToken,
      onTokenRefresh,
    } = require('@react-native-firebase/messaging');

    const messaging = getMessaging();

    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) return;

    const token = await getToken(messaging);
    if (!token || !userId) return;

    await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', userId);

    onTokenRefresh(messaging, async newToken => {
      await supabase
        .from('profiles')
        .update({ fcm_token: newToken })
        .eq('id', userId);
    });
  } catch (err) {
    console.warn('FCM token registration failed:', err);
  }
}
