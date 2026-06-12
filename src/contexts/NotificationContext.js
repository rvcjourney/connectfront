import React, { createContext, useState, useCallback, useRef } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const readIdsRef = useRef(new Set());

  const isRead = useCallback((id) => readIdsRef.current.has(id), []);

  const markAsRead = useCallback((id) => {
    if (!id || readIdsRef.current.has(id)) return;
    readIdsRef.current.add(id);
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback((ids = []) => {
    ids.forEach((id) => readIdsRef.current.add(id));
    setUnreadCount(0);
  }, []);

  const syncUnreadCount = useCallback((notifications = []) => {
    const count = notifications.filter((n) => !readIdsRef.current.has(n.id)).length;
    setUnreadCount(count);
  }, []);

  const value = {
    unreadCount,
    setUnreadCount,
    markAsRead,
    markAllRead,
    syncUnreadCount,
    isRead,
    incrementUnreadCount: () => setUnreadCount((c) => c + 1),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
