import { useState, useEffect } from 'react';
import { X, User, Bell, Shield, Palette, Globe, Save, Key, Activity, Copy, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { apiKeys } from '../data/mockData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
}

type Tab = 'profile' | 'notifications' | 'security' | 'appearance' | 'language' | 'api' | 'activity';

export function SettingsModal({ isOpen, onClose, activeTab }: SettingsModalProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLocalization();
  const [activeTabState, setActiveTabState] = useState<Tab>('profile');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Синхронизация внешней вкладки с внутренней
  useEffect(() => {
    if (activeTab) {
      setActiveTabState(activeTab as Tab);
    }
  }, [activeTab]);

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sales: true,
    system: true,
    alerts: true,
  });

  const tabs = [
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

  // Активность пользователя (моковые данные)
  const activityLog = [
    { id: 1, action: { ru: 'Вход в систему', en: 'Login' }, time: '2024-03-31 14:30', ip: '192.168.1.100' },
    { id: 2, action: { ru: 'Изменение настроек', en: 'Settings changed' }, time: '2024-03-31 13:15', ip: '192.168.1.100' },
    { id: 3, action: { ru: 'Экспорт отчёта', en: 'Report exported' }, time: '2024-03-31 11:45', ip: '192.168.1.100' },
    { id: 4, action: { ru: 'Создание пользователя', en: 'User created' }, time: '2024-03-30 16:20', ip: '192.168.1.100' },
    { id: 5, action: { ru: 'Вход в систему', en: 'Login' }, time: '2024-03-30 09:00', ip: '192.168.1.100' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
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
          {/* Sidebar */}
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

          {/* Content */}
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
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {language === 'ru' ? 'История активности' : 'Activity History'}
                  </h3>
                  <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    {language === 'ru' ? 'Скачать лог' : 'Download log'}
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 corporate:bg-slate-700/50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800 corporate:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          {language === 'ru' ? 'Действие' : 'Action'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          {language === 'ru' ? 'Время' : 'Time'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          IP адрес
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {activityLog.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {language === 'ru' ? log.action.ru : log.action.en}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {log.time}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {log.ip}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {language === 'ru' ? 'Показано последних 5 действий' : 'Showing last 5 activities'}
                  </span>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    {language === 'ru' ? 'Показать все' : 'View all'}
                  </button>
                </div>
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

                {/* Preview */}
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

        {/* Footer */}
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
