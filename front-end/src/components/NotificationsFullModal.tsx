import { useState } from 'react';
import {
  X,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Search,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  Users,
  Cpu,
  Clock,
} from 'lucide-react';
import { useNotifications, Notification } from '../contexts/NotificationContext';

interface NotificationsFullModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<Notification['type'], typeof Bell> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const typeColors: Record<Notification['type'], string> = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const categoryIcons: Record<Notification['category'], typeof Bell> = {
  system: Cpu,
  sales: ShoppingCart,
  users: Users,
  alerts: AlertTriangle,
};

const categoryLabels: Record<Notification['category'], string> = {
  system: 'Система',
  sales: 'Продажи',
  users: 'Пользователи',
  alerts: 'Оповещения',
};

type FilterType = 'all' | 'unread' | Notification['category'];

export function NotificationsFullModal({ isOpen, onClose }: NotificationsFullModalProps) {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(query) && !n.message.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (filter === 'unread') return !n.read;
    if (filter !== 'all') return n.category === filter;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const categoryCounts = notifications.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleMarkSelectedAsRead = () => {
    selectedIds.forEach(id => markAsRead(id));
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => removeNotification(id));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} дн назад`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Уведомления
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитано'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Прочитать все
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Очистить
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 corporate:border-slate-600 p-3 flex-shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                filter === 'all'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Все
              </span>
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setFilter('unread')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                filter === 'unread'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <BellOff className="w-4 h-4" />
                Непрочитанные
              </span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="my-3 border-t border-gray-200 dark:border-gray-600" />

            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Категории
            </p>

            {(Object.keys(categoryLabels) as Notification['category'][]).map(category => {
              const Icon = categoryIcons[category];
              return (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    filter === category
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {categoryLabels[category]}
                  </span>
                  {categoryCounts[category] > 0 && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                      {categoryCounts[category]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {}
          <div className="flex-1 flex flex-col overflow-hidden">
            {}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600 flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск уведомлений..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Выбрано: {selectedIds.size}
                  </span>
                  <button
                    onClick={handleMarkSelectedAsRead}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    title="Отметить прочитанными"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    title="Удалить выбранные"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {}
            {filteredNotifications.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Выбрать все ({filteredNotifications.length})
                </span>
              </div>
            )}

            {}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Нет уведомлений
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? 'По вашему запросу ничего не найдено'
                      : 'Здесь будут отображаться ваши уведомления'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredNotifications.map(notification => {
                    const TypeIcon = typeIcons[notification.type];
                    const CategoryIcon = categoryIcons[notification.category];

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          !notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(notification.id)}
                            onChange={() => toggleSelect(notification.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          
                          <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className={`font-medium ${
                                  !notification.read 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    title="Отметить прочитанным"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => removeNotification(notification.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatTime(notification.timestamp)}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <CategoryIcon className="w-3 h-3" />
                                {categoryLabels[notification.category]}
                              </span>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
