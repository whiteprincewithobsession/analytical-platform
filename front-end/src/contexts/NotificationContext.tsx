import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'system' | 'sales' | 'users' | 'alerts';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Высокая нагрузка системы',
    message: 'Загрузка CPU превысила 85%. Рекомендуется проверить активные процессы.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    category: 'system',
  },
  {
    id: '2',
    type: 'success',
    title: 'Рекорд продаж',
    message: 'Достигнут новый рекорд дневных продаж: 2.5M ₽',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    category: 'sales',
  },
  {
    id: '3',
    type: 'info',
    title: 'Новый пользователь',
    message: 'Зарегистрирован новый менеджер: Иванов И.И.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    category: 'users',
  },
  {
    id: '4',
    type: 'error',
    title: 'Ошибка синхронизации',
    message: 'Не удалось синхронизировать данные с внешним API',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    category: 'system',
  },
  {
    id: '5',
    type: 'warning',
    title: 'Низкий остаток товаров',
    message: '15 позиций требуют пополнения склада',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    category: 'alerts',
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
