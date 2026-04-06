import { useState, useRef, useEffect } from 'react';
import {
  User,
  Settings,
  LogOut,
  Shield,
  Bell,
  HelpCircle,
  ChevronRight,
  Key,
  Activity,
} from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useLocalization } from '../contexts/LocalizationContext';

interface ProfileMenuProps {
  onOpenSettings: (tab?: string) => void;
  onOpenHelp?: () => void;
  onOpenNotifications?: () => void;
}

export function ProfileMenu({ onOpenSettings, onOpenHelp, onOpenNotifications }: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleNotificationsClick = () => {
    setIsOpen(false);
    if (onOpenNotifications) {
      onOpenNotifications();
    }
  };

  const handleHelpClick = () => {
    setIsOpen(false);
    if (onOpenHelp) {
      onOpenHelp();
    }
  };

  const handleSecurityClick = () => {
    setIsOpen(false);
    onOpenSettings('security');
  };

  const handleApiKeysClick = () => {
    setIsOpen(false);
    onOpenSettings('api');
  };

  const handleActivityClick = () => {
    setIsOpen(false);
    onOpenSettings('security'); // Activity пока открывает security, можно добавить отдельную вкладку
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {user.name.charAt(0)}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white corporate:text-white">
            {user.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t(`roles.${user.role}`)}</div>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 corporate:border-slate-600 z-50 overflow-hidden">
            {/* User Info */}
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 corporate:from-blue-600 corporate:to-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 text-white">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm opacity-80">{user.email}</div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      user.role === 'analyst' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      user.role === 'manager' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {t(`roles.${user.role}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 corporate:divide-slate-600 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white corporate:text-white">
                  24
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('profile.sessions')}</div>
              </div>
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white corporate:text-white">
                  156
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('profile.actions')}</div>
              </div>
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {t('profile.online')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('profile.status')}</div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <MenuItem
                icon={User}
                label={t('profile.myProfile')}
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
              />
              <MenuItem
                icon={Settings}
                label={t('profile.settings')}
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
              />
              <MenuItem
                icon={Bell}
                label={t('profile.notifications')}
                badge={unreadCount > 0 ? String(unreadCount) : undefined}
                onClick={handleNotificationsClick}
              />
              <MenuItem
                icon={Shield}
                label={t('profile.security')}
                onClick={handleSecurityClick}
              />
              <MenuItem
                icon={Key}
                label={t('profile.apiKeys')}
                onClick={handleApiKeysClick}
              />
              <MenuItem
                icon={Activity}
                label={t('profile.activityHistory')}
                onClick={handleActivityClick}
              />

              <div className="my-2 border-t border-gray-200 dark:border-gray-700 corporate:border-slate-600" />

              <MenuItem
                icon={HelpCircle}
                label={t('profile.helpSupport')}
                onClick={handleHelpClick}
              />

              <div className="my-2 border-t border-gray-200 dark:border-gray-700 corporate:border-slate-600" />

              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t('profile.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: typeof User;
  label: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 corporate:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700 transition-colors"
    >
      <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}
