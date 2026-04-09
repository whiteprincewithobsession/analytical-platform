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
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-3 mb-4">
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

      {/* Superset Dashboard */}
      <div className="flex-1">
        <SupersetDashboard
          dashboardId="2"
          height="100%"
        />
      </div>
    </div>
  );
}
