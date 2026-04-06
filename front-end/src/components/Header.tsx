import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationPanel } from './NotificationPanel';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { GlobalSearch } from './GlobalSearch';

interface HeaderProps {
  pageTitle: string;
  onOpenSettings: () => void;
  onNavigate?: (path: string) => void;
  onOpenHelp?: () => void;
  onOpenNotifications?: () => void;
}

export function Header({ 
  pageTitle, 
  onOpenSettings, 
  onNavigate,
  onOpenHelp,
  onOpenNotifications 
}: HeaderProps) {
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleOpenNotifications = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      setShowNotifications(!showNotifications);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 corporate:bg-slate-800 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-700 px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white corporate:text-white">
          {pageTitle}
        </h1>
      </div>

      {/* Center - Global Search */}
      <GlobalSearch 
        onNavigate={onNavigate} 
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
      />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        </div>

        {/* Profile */}
        <ProfileMenu 
          onOpenSettings={onOpenSettings} 
          onOpenHelp={onOpenHelp}
          onOpenNotifications={handleOpenNotifications}
        />
      </div>
    </header>
  );
}
