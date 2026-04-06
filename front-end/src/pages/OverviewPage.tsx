import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { SupersetDashboard } from '../components/SupersetDashboard';

export const OverviewPage: React.FC = () => {
  const { t } = useLocalization();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('nav.overview')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('overview.welcome')}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[600px]">
        <SupersetDashboard 
          dashboardId="overview-dashboard" 
          title={t('overview.title')}
        />
      </div>
    </div>
  );
};
