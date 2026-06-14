import { useState, useEffect } from 'react';
import { X, User, Bell, Shield, Palette, Globe, Save, Key, Activity, Copy, Check, Trash2, Download, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useActivity, ActivityEntry } from '../contexts/ActivityContext';
import { apiKeys } from '../data/mockData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
}

type Tab = 'profile' | 'notifications' | 'security' | 'appearance' | 'language' | 'api' | 'activity';

function ActivityDot({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    login: 'bg-green-500',
    logout: 'bg-red-500',
    navigation: 'bg-blue-500',
    export: 'bg-purple-500',
    settings_change: 'bg-yellow-500',
    theme_change: 'bg-pink-500',
    language_change: 'bg-cyan-500',
    search: 'bg-indigo-500',
    report_create: 'bg-emerald-500',
    report_export: 'bg-violet-500',
    superset_view: 'bg-orange-500',
    product_edit: 'bg-teal-500',
    user_action: 'bg-amber-500',
    notification_view: 'bg-sky-500',
    custom: 'bg-gray-500',
  };
  const color = colorMap[type] || colorMap.custom;
  return <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />;
}

export function SettingsModal({ isOpen, onClose, activeTab }: SettingsModalProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLocalization();
  const { entries, clear } = useActivity();
  const [activeTabState, setActiveTabState] = useState<Tab>('profile');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [activityLimit, setActivityLimit] = useState(20);


  useEffect(() => {
    if (activeTab) {
      setActiveTabState(activeTab as Tab);
    }
  }, [activeTab]);

  const displayedActivities = entries.slice(0, activityLimit);

  const formatActivityTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (language === 'ru') {
      if (diffMin < 1) return 'Только что';
      if (diffMin < 60) return `${diffMin} мин. назад`;
      if (diffHrs < 24) return `${diffHrs} ч. назад`;
      if (diffDays < 7) return `${diffDays} дн. назад`;
      return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getActivityLabel = (entry: ActivityEntry): string => {
    const key = `activity.types.${entry.actionKey}`;
    const translated = t(key);
    // If translation returns the key itself, fallback to actionKey
    if (translated === key || translated === entry.actionKey) {
      return entry.actionKey;
    }
    return translated;
  };

  const handleDownloadLog = () => {
    const logData = entries.map(e => ({
      time: e.timestamp,
      type: e.type,
      action: e.actionKey,
      details: e.details || '',
      ip: e.ip || '',
    }));
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLog = () => {
    clear();
    setActivityLimit(20);
  };

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sales: true,
    system: true,
    alerts: true,
  });

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: t('profile.myProfile'), icon: User },
    { id: 'notifications', label: t('profile.notifications'), icon: Bell },
    { id: 'security', label: t('profile.security'), icon: Shield },
    { id: 'api', label: t('profile.apiKeys'), icon: Key },
    { id: 'activity', label: t('profile.activityHistory'), icon: Activity },
    { id: 'appearance', label: t('common.theme'), icon: Palette },
    { id: 'language', label: t('common.language'), icon: Globe },
  ];

  const themeLabels: Record<ThemeMode, { ru: string; en: string }> = {
    light: { ru: 'Светлая', en: 'Light' },
    dark: { ru: 'Тёмная', en: 'Dark' },
    corporate: { ru: 'Корпоративная', en: 'Corporate' },
    system: { ru: 'Системная', en: 'System' },
  };

  const notificationLabels = {
    email: { ru: 'Email уведомления', en: 'Email notifications' },
    push: { ru: 'Push-уведомления в браузере', en: 'Browser push notifications' },
    sales: { ru: 'Уведомления о продажах', en: 'Sales notifications' },
    system: { ru: 'Системные уведомления', en: 'System notifications' },
    alerts: { ru: 'Критические оповещения', en: 'Critical alerts' },
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white corporate:text-white">
            {t('profile.settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex min-h-[500px]">
          {}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 corporate:border-slate-600 p-3">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTabState(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  activeTabState === id
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 corporate:bg-blue-900/50 text-indigo-700 dark:text-indigo-300 corporate:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTabState === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ru' ? 'Фото профиля' : 'Profile Photo'}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                      {user?.name.charAt(0)}
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      {language === 'ru' ? 'Изменить' : 'Change'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ru' ? 'Имя' : 'Name'}
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 corporate:border-slate-600 bg-white dark:bg-gray-700 corporate:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 corporate:border-slate-600 bg-white dark:bg-gray-700 corporate:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ru' ? 'Должность' : 'Position'}
                  </label>
                  <input
                    type="text"
                    defaultValue={language === 'ru' ? 'Администратор системы' : 'System Administrator'}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 corporate:border-slate-600 bg-white dark:bg-gray-700 corporate:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {activeTabState === 'notifications' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  {language === 'ru' ? 'Настройки уведомлений' : 'Notification Settings'}
                </h3>
                {Object.entries(notificationLabels).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 corporate:bg-slate-700/50"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {language === 'ru' ? label.ru : label.en}
                    </span>
                    <button
                      onClick={() =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof prev],
                        }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notificationSettings[key as keyof typeof notificationSettings]
                          ? 'bg-indigo-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          notificationSettings[key as keyof typeof notificationSettings]
                            ? 'translate-x-6'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            )}

            {activeTabState === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    {language === 'ru' ? 'Смена пароля' : 'Change Password'}
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="password"
                      placeholder={language === 'ru' ? 'Текущий пароль' : 'Current password'}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      placeholder={language === 'ru' ? 'Новый пароль' : 'New password'}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      placeholder={language === 'ru' ? 'Подтвердите новый пароль' : 'Confirm new password'}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    {language === 'ru' ? 'Двухфакторная аутентификация' : 'Two-Factor Authentication'}
                  </h3>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    {language === 'ru' ? 'Включить 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            )}

            {activeTabState === 'api' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {language === 'ru' ? 'API ключи' : 'API Keys'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ru' 
                        ? 'Управление ключами доступа к API' 
                        : 'Manage API access keys'}
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                    <Key className="w-4 h-4" />
                    {language === 'ru' ? 'Создать ключ' : 'Create Key'}
                  </button>
                </div>

                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 corporate:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {apiKey.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {language === 'ru' ? 'Создан' : 'Created'}: {apiKey.created}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyKey(apiKey.keyValue, apiKey.id)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                            title={language === 'ru' ? 'Копировать ключ' : 'Copy key'}
                          >
                            {copiedKeyId === apiKey.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                            title={language === 'ru' ? 'Отозвать ключ' : 'Revoke key'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 p-2 bg-white dark:bg-gray-800 rounded font-mono text-xs text-gray-600 dark:text-gray-300">
                        <span className="truncate">{apiKey.keyValue}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {language === 'ru' ? 'Последнее использование' : 'Last used'}: {apiKey.lastUsed}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {language === 'ru' ? 'Активен' : 'Active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-900 dark:text-amber-300">
                        {language === 'ru' ? 'Важно!' : 'Important!'}
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        {language === 'ru'
                          ? 'Никогда не передавайте API ключи третьим лицам. При компрометации ключа немедленно отзовите его.'
                          : 'Never share your API keys with third parties. Revoke immediately if compromised.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabState === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('activity.title')}
                  </h3>
                  <div className="flex gap-2">
                    {entries.length > 0 && (
                      <button
                        onClick={handleClearLog}
                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline"
                      >
                        {t('activity.clearLog')}
                      </button>
                    )}
                    <button
                      onClick={handleDownloadLog}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      {t('activity.downloadLog')}
                    </button>
                  </div>
                </div>

                {displayedActivities.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">{t('activity.noActivity')}</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                      {/* Fixed header */}
                      <div className="bg-gray-100 dark:bg-gray-800 corporate:bg-slate-800 px-4 py-3">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr>
                              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                {t('activity.columns.action')}
                              </th>
                              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                {t('activity.columns.time')}
                              </th>
                              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                                {t('activity.columns.ipAddress')}
                              </th>
                              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">
                                {t('activity.columns.details')}
                              </th>
                            </tr>
                          </thead>
                        </table>
                      </div>
                      {/* Scrollable body */}
                      <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
                        <table className="w-full min-w-[600px]">
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {displayedActivities.map((entry) => (
                              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  <span className="inline-flex items-center gap-1.5">
                                    <ActivityDot type={entry.type} />
                                    {getActivityLabel(entry)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                                  {formatActivityTime(entry.timestamp)}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono hidden sm:table-cell">
                                  {entry.ip || '—'}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 max-w-[200px] truncate hidden lg:table-cell">
                                  {entry.details || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {t('activity.showingLast').replace('{count}', String(displayedActivities.length))}
                      </span>
                      {entries.length > activityLimit && (
                        <button
                          onClick={() => setActivityLimit(prev => prev + 20)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {t('activity.viewAll')}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTabState === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    {language === 'ru' ? 'Тема оформления' : 'Theme'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['light', 'dark', 'corporate', 'system'] as ThemeMode[]).map(themeOption => (
                      <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          theme === themeOption
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div
                          className={`w-full h-16 rounded-lg mb-2 ${
                            themeOption === 'light'
                              ? 'bg-gradient-to-br from-white to-gray-100 border'
                              : themeOption === 'dark'
                              ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                              : themeOption === 'corporate'
                              ? 'bg-gradient-to-br from-slate-700 to-slate-900'
                              : 'bg-gradient-to-br from-gray-200 to-gray-400'
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {themeLabels[themeOption][language === 'ru' ? 'ru' : 'en']}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTabState === 'language' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    {t('settingsSections.localization.language')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                      { code: 'en', name: 'English', flag: '🇬🇧' },
                    ].map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code as 'ru' | 'en')}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg ring-2 ring-indigo-500/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md bg-white dark:bg-gray-800'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <span className="text-4xl flex-shrink-0">{lang.flag}</span>
                            <div className="text-left">
                              <div className="font-bold text-gray-900 dark:text-white text-lg">
                                {lang.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {lang.code === 'ru' ? 'Russian' : 'English'}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {language === 'ru' ? 'Предпросмотр' : 'Preview'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {language === 'ru' ? 'Язык:' : 'Language:'}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {language === 'ru' ? 'Русский' : 'English'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {language === 'ru' ? 'Привет!' : 'Hello!'}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {language === 'ru' ? 'Привет!' : 'Hello!'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {language === 'ru' ? 'Пример:' : 'Example:'}
                      </span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {language === 'ru' ? '₽ 1 234' : '$ 1,234'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 corporate:border-slate-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {language === 'ru' ? 'Сохранить изменения' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
