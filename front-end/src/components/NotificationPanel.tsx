import { useState } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Server,
  ShoppingCart,
  Users,
  AlertOctagon,
} from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '../contexts/NotificationContext';

const typeIcons: Record<NotificationType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const typeColors: Record<NotificationType, string> = {
  info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  error: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  success: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
};

const categoryIcons = {
  system: Server,
  sales: ShoppingCart,
  users: Users,
  alerts: AlertOctagon,
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  return `${days} дн. назад`;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-96 max-h-[calc(100vh-100px)] bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 corporate:border-slate-600 z-50 overflow-hidden flex flex-col">
        {}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white corporate:text-white">
              Уведомления
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 corporate:bg-blue-900/50 text-indigo-700 dark:text-indigo-300 corporate:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Все ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 corporate:bg-blue-900/50 text-indigo-700 dark:text-indigo-300 corporate:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Непрочитанные ({unreadCount})
            </button>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Нет уведомлений</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 corporate:divide-slate-600">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                  onRemove={() => removeNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </div>

        {}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 corporate:border-slate-600 flex items-center justify-between">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 corporate:text-blue-400 hover:underline"
            >
              <CheckCheck className="w-4 h-4" />
              Прочитать все
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              <Trash2 className="w-4 h-4" />
              Очистить
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onRemove: () => void;
}) {
  const TypeIcon = typeIcons[notification.type];
  const CategoryIcon = categoryIcons[notification.category];

  return (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 corporate:hover:bg-slate-700/50 transition-colors ${
        !notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10 corporate:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex gap-3">
        <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white corporate:text-white text-sm">
              {notification.title}
            </h4>
            <div className="flex items-center gap-1">
              {!notification.read && (
                <button
                  onClick={onMarkAsRead}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Отметить как прочитанное"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500"
                title="Удалить"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 corporate:text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <CategoryIcon className="w-3 h-3" />
              {notification.category === 'system' && 'Система'}
              {notification.category === 'sales' && 'Продажи'}
              {notification.category === 'users' && 'Пользователи'}
              {notification.category === 'alerts' && 'Оповещения'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatTime(notification.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
