import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { NotificationsFullModal } from './components/NotificationsFullModal';
import { ProtectedPage, AccessDeniedPage } from './components/PermissionGate';
import { OverviewPage } from './pages/OverviewPage';
import { SalesPage } from './pages/SalesPage';
import { UsersPage } from './pages/UsersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { DashboardsPage } from './pages/DashboardsPage';
import SettingsPage from './pages/SettingsPage';
import { hasPermission, pagePermissions } from './config/permissions';

function AdminPanel() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLocalization();
  const [activePage, setActivePage] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string | undefined>(undefined);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleOpenSettings = (tab?: string) => {
    setSettingsTab(tab);
    setShowSettings(true);
  };

  const pageTitles: Record<string, string> = {
    overview: t('nav.overview'),
    sales: t('nav.sales'),
    products: t('nav.products'),
    analytics: t('nav.analytics'),
    dashboards: t('nav.dashboards'),
    users: t('nav.users'),
    reports: t('nav.reports'),
    settings: t('nav.settings'),
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    const requiredPermissions = pagePermissions[activePage];
    const hasAccess = requiredPermissions?.every(p => hasPermission(user?.role, p)) ?? true;

    if (!hasAccess) {
      return <AccessDeniedPage />;
    }

    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'sales':
        return <SalesPage />;
      case 'products':
        return <ProductsPage />;
      case 'analytics':
        return (
          <ProtectedPage permission="view_analytics">
            <AnalyticsPage />
          </ProtectedPage>
        );
      case 'dashboards':
        return (
          <ProtectedPage permission="view_dashboards">
            <DashboardsPage />
          </ProtectedPage>
        );
      case 'reports':
        return (
          <ProtectedPage permission="view_reports">
            <ReportsPage />
          </ProtectedPage>
        );
      case 'users':
        return (
          <ProtectedPage permission="view_users">
            <UsersPage />
          </ProtectedPage>
        );
      case 'settings':
        return (
          <ProtectedPage permission="view_settings">
            <SettingsPage />
          </ProtectedPage>
        );
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 corporate:bg-slate-900">
      <Sidebar 
        activePage={activePage} 
        onPageChange={setActivePage} 
        onOpenHelp={() => setShowHelp(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          pageTitle={pageTitles[activePage] || 'Обзор'}
          onOpenSettings={handleOpenSettings}
          onNavigate={setActivePage}
          onOpenHelp={() => setShowHelp(true)}
          onOpenNotifications={() => setShowNotifications(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} activeTab={settingsTab} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <NotificationsFullModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocalizationProvider>
        <AuthProvider>
          <NotificationProvider>
            <AdminPanel />
          </NotificationProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
