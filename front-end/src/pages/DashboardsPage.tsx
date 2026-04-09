import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, ChevronDown, AlertCircle, Loader2, Check } from 'lucide-react';
import { SupersetDashboard } from '../components/SupersetDashboard';

interface DashboardItem {
  id: number;
  dashboard_title: string;
  published: boolean;
}

export const DashboardsPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const res = await fetch('/api/v1/dashboard/?q=(page:0,page_size:100)');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        const list: DashboardItem[] = data.result || [];
        setDashboards(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch {
        setError('Не удалось загрузить список дашбордов');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboards();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDashboard = dashboards.find(d => d.id === selectedId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Загрузка панелей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Ошибка</h3>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Selector Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-4 h-4" />
          <span>Выберите панель:</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-all min-w-[280px] text-left group"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                {selectedDashboard?.dashboard_title || 'Выберите дашборд'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {dashboards.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedId(d.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selectedId === d.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <BarChart3 className={`w-4 h-4 flex-shrink-0 ${
                      selectedId === d.id ? 'text-indigo-500' : 'text-gray-400'
                    }`} />
                    <span className="flex-1 text-sm font-medium truncate">
                      {d.dashboard_title || 'Без названия'}
                    </span>
                    {selectedId === d.id && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              {dashboards.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Нет доступных дашбордов
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 bg-white dark:bg-gray-800">
        {selectedId ? (
          <SupersetDashboard
            dashboardId={String(selectedId)}
            height="100%"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Выберите дашборд
          </div>
        )}
      </div>
    </div>
  );
};
