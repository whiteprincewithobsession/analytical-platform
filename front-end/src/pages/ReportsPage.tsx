import { useState } from 'react';
import {
  FileText,
  Download,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { PermissionGate } from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';

interface Report {
  id: number;
  name: string;
  type: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  size: string;
  author: string;
}

const reports: Report[] = [
  { id: 1, name: 'Отчёт по продажам - Январь 2024', type: 'Продажи', status: 'completed', createdAt: '2 часа назад', size: '2.4 MB', author: 'Администратор' },
  { id: 2, name: 'Аналитика пользователей Q4', type: 'Пользователи', status: 'completed', createdAt: '5 часов назад', size: '1.8 MB', author: 'Аналитик' },
  { id: 3, name: 'Финансовый отчёт - Декабрь', type: 'Финансы', status: 'processing', createdAt: '30 мин назад', size: '-', author: 'Администратор' },
  { id: 4, name: 'Возвраты и рекламации', type: 'Продажи', status: 'completed', createdAt: '1 день назад', size: '856 KB', author: 'Менеджер' },
  { id: 5, name: 'Инвентаризация склада', type: 'Товары', status: 'failed', createdAt: '2 дня назад', size: '-', author: 'Менеджер' },
  { id: 6, name: 'Маркетинговая аналитика', type: 'Маркетинг', status: 'completed', createdAt: '3 дня назад', size: '3.2 MB', author: 'Аналитик' },
];

const reportTypes = ['Все', 'Продажи', 'Пользователи', 'Финансы', 'Товары', 'Маркетинг'];

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Готов' },
  processing: { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Формируется' },
  failed: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Ошибка' },
};

export function ReportsPage() {
  const [selectedType, setSelectedType] = useState('Все');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { can } = usePermissions();

  const filteredReports = reports.filter(
    report => selectedType === 'Все' || report.type === selectedType
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Отчёты</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Создание и управление отчётами
          </p>
        </div>
        <PermissionGate permission="create_reports">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Создать отчёт
          </button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {reportTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === type
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Название
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Тип
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Статус
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Создан
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Размер
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredReports.map(report => {
                const status = statusConfig[report.status];
                const StatusIcon = status.icon;
                const isCompleted = report.status === 'completed';

                return (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{report.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{report.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${report.status === 'processing' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {report.createdAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {report.size}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                          <Eye className="w-4 h-4" />
                        </button>
                        {isCompleted && can('export_data') && (
                          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {report.status === 'failed' && (
                          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <PermissionGate permission="create_reports">
                          <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Создать отчёт</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название отчёта
                </label>
                <input
                  type="text"
                  placeholder="Введите название..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Тип отчёта
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {reportTypes.filter(t => t !== 'Все').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Период
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="date"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
