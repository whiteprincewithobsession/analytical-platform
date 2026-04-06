import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Building2, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

const themes: { value: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Светлая', icon: Sun, description: 'Яркая тема для дневной работы' },
  { value: 'dark', label: 'Тёмная', icon: Moon, description: 'Тёмная тема для комфорта глаз' },
  { value: 'corporate', label: 'Корпоративная', icon: Building2, description: 'Синяя бизнес-тема' },
  { value: 'system', label: 'Системная', icon: Monitor, description: 'Следует настройкам ОС' },
];

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700 text-gray-600 dark:text-gray-300 corporate:text-slate-300 transition-colors"
        title="Сменить тему"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 corporate:border-slate-600 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
              <h3 className="font-semibold text-gray-900 dark:text-white corporate:text-white">
                Выбор темы
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Текущая: {resolvedTheme === 'light' ? 'светлая' : resolvedTheme === 'dark' ? 'тёмная' : 'корпоративная'}
              </p>
            </div>
            <div className="p-2">
              {themes.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    theme === value
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 corporate:bg-blue-900/50 text-indigo-700 dark:text-indigo-300 corporate:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 corporate:hover:bg-slate-700 text-gray-700 dark:text-gray-300 corporate:text-slate-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      theme === value
                        ? 'bg-indigo-200 dark:bg-indigo-800 corporate:bg-blue-800'
                        : 'bg-gray-100 dark:bg-gray-700 corporate:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs opacity-70">{description}</div>
                  </div>
                  {theme === value && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
