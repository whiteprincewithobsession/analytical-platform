import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { PermissionGate } from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { useLocalization } from '../contexts/LocalizationContext';
import { SupersetDashboard } from '../components/SupersetDashboard';

export function SalesPage() {
  const [dateRange, setDateRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useLocalization();
  usePermissions();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const dateRangeLabels: Record<string, string> = {
    week: t('common.week'),
    month: t('common.month'),
    quarter: t('common.quarter'),
    year: t('common.year'),
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.sales')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('sales.title')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            {['week', 'month', 'quarter', 'year'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {dateRangeLabels[range]}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <PermissionGate permission="export_data">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Download className="w-4 h-4" />
              {t('common.export')}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Superset Dashboard Integration */}
      <div className="flex-1 min-h-[600px]">
        <SupersetDashboard
          dashboardId="sales-dashboard"
          title={`${t('nav.sales')}: ${dateRangeLabels[dateRange]}`}
          height="calc(100vh - 280px)"
        />
      </div>
    </div>
  );
}
