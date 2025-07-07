'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import Notification from '@/components/shared/ui/Notification';

type Position = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: Position;
}

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (
    message: string,
    type?: 'success' | 'error' | 'warning' | 'info',
    options?: {
      duration?: number;
      position?: Position;
    }
  ) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  success: (message: string, options?: { duration?: number; position?: Position }) => string;
  error: (message: string, options?: { duration?: number; position?: Position }) => string;
  warning: (message: string, options?: { duration?: number; position?: Position }) => string;
  info: (message: string, options?: { duration?: number; position?: Position }) => string | undefined;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const addNotification = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    options?: {
      duration?: number;
      position?: Position;
    }
  ) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const notification: NotificationData = {
      id,
      message,
      type,
      duration: options?.duration,
      position: options?.position
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const success = useCallback((message: string, options?: { duration?: number; position?: Position }) => {
    return addNotification(message, 'success', options);
  }, [addNotification]);

  const error = useCallback((message: string, options?: { duration?: number; position?: Position }) => {
    return addNotification(message, 'error', options);
  }, [addNotification]);

  const warning = useCallback((message: string, options?: { duration?: number; position?: Position }) => {
    return addNotification(message, 'warning', options);
  }, [addNotification]);

  const info = useCallback((message: string, options?: { duration?: number; position?: Position }) => {
    return addNotification(message, 'info', options);
  }, [addNotification]);

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {hasMounted && notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          position={notification.position}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}; 