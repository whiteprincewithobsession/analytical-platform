import React from 'react';
import { Activity, Database } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';

interface DashboardPlaceholderProps {
  dashboardId: string;
  title?: string;
}

export const DashboardPlaceholder: React.FC<DashboardPlaceholderProps> = ({
  dashboardId,
  title
}) => {
  const { t } = useLocalization();

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6">
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dashboard ID: {dashboardId}
          </p>
        </div>
      )}

      {/* Placeholder Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
          <Database className="w-10 h-10 text-white" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('superset.integration')}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
          {t('superset.willBeHere')}
          <br />
          {t('superset.configureEnv')} <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">VITE_SUPERSET_URL</code>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
            Dashboard: {dashboardId}
          </span>
          <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
            {t('superset.status')}
          </span>
        </div>
      </div>
    </div>
  );
};
