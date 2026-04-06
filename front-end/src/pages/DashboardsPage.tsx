import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { SupersetDashboard } from '../components/SupersetDashboard';

// Пример списка дашбордов, которые будут доступны
const AVAILABLE_DASHBOARDS = [
  { id: 'sales-overview', titleKey: 'dashboards.salesOverview', descriptionKey: 'dashboards.salesOverviewDesc' },
  { id: 'inventory-status', titleKey: 'dashboards.inventoryStatus', descriptionKey: 'dashboards.inventoryStatusDesc' },
  { id: 'promo-efficiency', titleKey: 'dashboards.promoEfficiency', descriptionKey: 'dashboards.promoEfficiencyDesc' },
];

export const DashboardsPage: React.FC = () => {
  const { t } = useLocalization();
  const [activeDashboard, setActiveDashboard] = useState(AVAILABLE_DASHBOARDS[0].id);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('nav.dashboards')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('dashboards.description')}
          </p>
        </div>
      </div>

      {/* Вкладки для переключения дашбордов */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {AVAILABLE_DASHBOARDS.map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => setActiveDashboard(dashboard.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeDashboard === dashboard.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {t(dashboard.titleKey)}
            </button>
          ))}
        </nav>
      </div>

      {/* Контейнер для дашборда */}
      <div className="flex-1 min-h-[600px]">
        <SupersetDashboard
          dashboardId={activeDashboard}
          title={t(AVAILABLE_DASHBOARDS.find(d => d.id === activeDashboard)?.titleKey || '')}
        />
      </div>
    </div>
  );
};
