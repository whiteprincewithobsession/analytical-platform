import { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart3,
  PieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  FileText,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { Permission, hasPermission, roleDescriptions } from '../config/permissions';

interface NavItem {
  id: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
}

const navItems: NavItem[] = [
  { id: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard, permission: 'view_dashboard' },
  { id: 'dashboards', labelKey: 'nav.dashboards', icon: PieChart, permission: 'view_dashboards' },
  { id: 'sales', labelKey: 'nav.sales', icon: ShoppingCart, permission: 'view_sales' },
  { id: 'products', labelKey: 'nav.products', icon: Package, permission: 'view_products' },
  { id: 'analytics', labelKey: 'nav.analytics', icon: BarChart3, permission: 'view_analytics' },
  { id: 'reports', labelKey: 'nav.reports', icon: FileText, permission: 'view_reports' },
  { id: 'users', labelKey: 'nav.users', icon: Users, permission: 'view_users' },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings, permission: 'view_settings' },
];

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onOpenHelp?: () => void;
}

export function Sidebar({ activePage, onPageChange, onOpenHelp }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { language, t } = useLocalization();

  const roleInfo = user ? roleDescriptions[user.role] : null;

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-800 corporate:bg-slate-900 border-r border-gray-200 dark:border-gray-700 corporate:border-slate-700 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white corporate:text-white">
              {t('common.marketplace')}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
          title={isCollapsed ? t('common.expand') : t('common.collapse')}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {}
      {!isCollapsed && roleInfo && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {t('common.yourRole')}
          </div>
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-sm font-medium ${
            user?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
            user?.role === 'analyst' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
            user?.role === 'manager' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {language === 'en' ? roleInfo.titleEn : roleInfo.title}
          </div>
        </div>
      )}

      {}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const hasAccess = !item.permission || hasPermission(user?.role, item.permission);
          const label = t(item.labelKey);

          if (!hasAccess) {

            return (
              <div
                key={item.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-600 cursor-not-allowed ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={isCollapsed ? `${label} (${t('common.noAccess')})` : t('common.noAccess')}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1">{label}</span>
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 corporate:bg-blue-900/50 text-indigo-700 dark:text-indigo-300 corporate:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 corporate:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-800'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400 corporate:text-blue-400' : ''}`} />
              {!isCollapsed && <span className="font-medium">{label}</span>}
            </button>
          );
        })}
      </nav>

      {}
      {!isCollapsed && roleInfo && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 corporate:border-slate-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {roleInfo.capabilities.length} {t('common.permissionsActive')}
          </div>
        </div>
      )}

      {}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 corporate:border-slate-700">
        <button
          onClick={onOpenHelp}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">{t('common.help')}</span>}
        </button>
      </div>
    </aside>
  );
}
