import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { DashboardPlaceholder } from './DashboardPlaceholder';

interface SupersetDashboardProps {
  dashboardId: string;
  title?: string;
  height?: string;
}

export const SupersetDashboard: React.FC<SupersetDashboardProps> = ({
  dashboardId,
  title,
  height = 'calc(100vh - 200px)'
}) => {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL для подключения к Apache Superset
  // const iframeUrl = `${process.env.VITE_SUPERSET_URL}/superset/dashboard/${dashboardId}/?standalone=1`;
  const iframeUrl = ''; // Пустой, пока нет реального URL

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Не удалось загрузить дашборд');
    setIsLoading(false);
  };

  // Если URL пустой, сразу снимаем загрузку
  React.useEffect(() => {
    if (!iframeUrl) {
      setIsLoading(false);
    }
  }, [iframeUrl]);

  return (
    <div className="flex flex-col w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height }}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}

      <div className="relative flex-1 w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('common.error')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          </div>
        )}

        {/* Контейнер для встраивания Superset через iframe или заглушка */}
        <div className="w-full h-full absolute inset-0">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={title || 'Superset Dashboard'}
              className="w-full h-full border-0"
              allow="fullscreen"
            />
          ) : (
            <DashboardPlaceholder dashboardId={dashboardId} title={title} />
          )}
        </div>
      </div>
    </div>
  );
};
