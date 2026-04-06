import { useState, useEffect } from 'react';
import { AlertTriangle, X, Cpu, HardDrive, Wifi, Activity } from 'lucide-react';

interface SystemAlert {
  id: string;
  type: 'cpu' | 'memory' | 'network' | 'general';
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
}

const alertIcons = {
  cpu: Cpu,
  memory: HardDrive,
  network: Wifi,
  general: Activity,
};

export function SystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'cpu',
      severity: 'warning',
      message: 'Высокая нагрузка CPU',
      value: 87,
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Симуляция изменения нагрузки
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(prev =>
        prev.map(alert => ({
          ...alert,
          value: alert.value ? Math.max(60, Math.min(95, alert.value + (Math.random() - 0.5) * 10)) : undefined,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-4">
      <div
        className={`rounded-xl overflow-hidden transition-all ${
          alerts.some(a => a.severity === 'critical')
            ? 'bg-red-50 dark:bg-red-900/20 corporate:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-900/20 corporate:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-5 h-5 ${
                alerts.some(a => a.severity === 'critical')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <span
              className={`font-medium ${
                alerts.some(a => a.severity === 'critical')
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-amber-800 dark:text-amber-300'
              }`}
            >
              Системные оповещения ({alerts.length})
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </span>
        </button>

        {/* Alerts List */}
        {isExpanded && (
          <div className="border-t border-amber-200 dark:border-amber-800/50">
            {alerts.map(alert => {
              const Icon = alertIcons[alert.type];
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 p-3 border-b last:border-b-0 border-amber-200/50 dark:border-amber-800/30"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        alert.severity === 'critical'
                          ? 'text-red-800 dark:text-red-300'
                          : 'text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {alert.message}
                    </div>
                    {alert.value && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              alert.value > 90
                                ? 'bg-red-500'
                                : alert.value > 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${alert.value}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-mono font-bold ${
                            alert.value > 90
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {Math.round(alert.value)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
