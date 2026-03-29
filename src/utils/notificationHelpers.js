import notifee from '@notifee/react-native';

export const requestNotificationPermission = async () => {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus;
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

export const displayLocalNotification = async ({
  title,
  body,
  data = {},
  channelId = 'default',
}) => {
  try {
    // Create channel (Android required)
    await notifee.createChannel({
      id: channelId,
      name: 'Default Channel',
      vibration: true,
      vibrationPattern: [100, 100],
    });

    // Display notification
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        color: '#ff308a',
        pressAction: {
          id: 'default',
        },
      },
      data,
    });
  } catch (error) {
    console.error('Notification display error:', error);
  }
};

export const cancelAllNotifications = async () => {
  try {
    await notifee.cancelAllNotifications();
  } catch (error) {
    console.error('Cancel notifications error:', error);
  }
};

export const cancelNotification = async (notificationId) => {
  try {
    await notifee.cancelNotification(notificationId);
  } catch (error) {
    console.error('Cancel notification error:', error);
  }
};

// Foreground notification handler
export const handleForegroundNotification = (callback) => {
  const unsubscribe = notifee.onForegroundEvent(({ type, notification }) => {
    callback({ type, notification });
  });

  return unsubscribe;
};

// Background notification handler
export const handleBackgroundNotification = (callback) => {
  notifee.onBackgroundEvent(async ({ type, notification }) => {
    callback({ type, notification });
  });
};
