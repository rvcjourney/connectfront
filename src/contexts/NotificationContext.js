import React, { createContext, useState } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const markAllRead = () => {
    setUnreadCount(0);
  };

  const incrementUnreadCount = () => {
    setUnreadCount(prev => prev + 1);
  };

  const value = {
    unreadCount,
    setUnreadCount,
    markAllRead,
    incrementUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
