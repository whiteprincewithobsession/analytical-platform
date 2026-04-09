import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { SupersetLoginGate } from './components/SupersetLoginGate';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { SalesPage } from './pages/SalesPage';
import { ProductsPage } from './pages/ProductsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';

function AppContent() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string | null>(null);

  const renderPage = () => {
    switch (activePage) {
      case 'overview': return <OverviewPage />;
      case 'dashboards': return <DashboardsPage />;
      case 'sales': return <SalesPage />;
      case 'products': return <ProductsPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'reports': return <ReportsPage />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 corporate:bg-slate-950">
      {sidebarOpen && <Sidebar activePage={activePage} onPageChange={setActivePage} onOpenHelp={() => setHelpOpen(true)} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={setSettingsTab}
          onNavigate={setActivePage}
          onOpenHelp={() => setHelpOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      {settingsTab && <SettingsModal isOpen={!!settingsTab} onClose={() => setSettingsTab(null)} activeTab={settingsTab} />}
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const authFlag = sessionStorage.getItem('superset_authenticated');
    if (authFlag === 'true') {
      // Verify session is still valid
      fetch('/api/v1/me/', { credentials: 'include' })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('superset_authenticated');
          }
        })
        .catch(() => sessionStorage.removeItem('superset_authenticated'))
        .finally(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
          <p className="mt-4 text-indigo-200">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SupersetLoginGate onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <ThemeProvider>
      <LocalizationProvider>
        <NotificationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NotificationProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
