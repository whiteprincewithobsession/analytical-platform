import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  FileText,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Package,
  Clock,
  ArrowRight,
  Command,
  Hash,
  User,
  TrendingUp,
  Bell,
  HelpCircle,
  Shield,
  Key,
  Star,
  Filter,
  Zap,
} from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useSearch, highlightText } from '../hooks/useSearch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { searchItems, popularSearches, searchFilters, type SearchFilter } from '../data/searchItems';

interface GlobalSearchProps {
  onNavigate?: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export function GlobalSearch({ onNavigate, onOpenSettings, onOpenHelp }: GlobalSearchProps) {
  const { language } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent_searches', []);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Умный поиск с использованием хука
  const { results, groupedResults } = useSearch({
    query,
    items: searchItems,
    filter: activeFilter,
    language,
    limit: 15,
  });

  // Сохранение недавнего поиска
  const saveRecentSearch = useCallback((search: string) => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== normalized);
      return [search, ...filtered].slice(0, 10);
    });
  }, [setRecentSearches]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Фокус при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Навигация клавиатурой
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: typeof results[0]) => {
    saveRecentSearch(result.title);
    setIsOpen(false);

    if (result.type === 'page' && result.path && onNavigate) {
      onNavigate(result.path);
    } else if (result.type === 'setting' && onOpenSettings) {
      onOpenSettings();
    } else if (result.type === 'help' && onOpenHelp) {
      onOpenHelp();
    }
  };

  const handleQuickSearch = (search: string) => {
    setQuery(search);
    saveRecentSearch(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Получение текста на текущем языке
  const getText = (item: typeof results[0], field: 'title' | 'description'): string => {
    if (language === 'en' && (item as any)[`${field}En`]) {
      return (item as any)[`${field}En`];
    }
    return item[field];
  };

  // Плоский список для навигации
  const flatResults = Object.values(groupedResults).flat();

  return (
    <>
      {/* Search Input */}
      <div className="flex-1 max-w-md mx-8">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 corporate:border-slate-600 bg-gray-50 dark:bg-gray-700 corporate:bg-slate-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className="flex-1 text-left">{language === 'ru' ? 'Поиск...' : 'Search...'}</span>
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>
      </div>

      {/* Search Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl z-50">
            <div className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 corporate:border-slate-600 overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={language === 'ru' 
                    ? 'Поиск страниц, пользователей, заказов, товаров...' 
                    : 'Search pages, users, orders, products...'}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">ESC</kbd>
              </div>

              {/* Filters */}
              {query.trim() !== '' && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600 flex items-center gap-2 overflow-x-auto">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {Object.entries(searchFilters).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key as SearchFilter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        activeFilter === key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {language === 'en' ? label.en : label.ru}
                    </button>
                  ))}
                </div>
              )}

              {/* Results */}
              <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
                {query.trim() === '' ? (
                  <div className="p-4">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {language === 'ru' ? 'Недавние запросы' : 'Recent Searches'}
                          </h3>
                          <button onClick={clearRecentSearches} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            {language === 'ru' ? 'Очистить' : 'Clear'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map(search => (
                            <button
                              key={search}
                              onClick={() => handleQuickSearch(search)}
                              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                            >
                              <Clock className="w-3 h-3" />
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Searches */}
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        {language === 'ru' ? 'Популярные запросы' : 'Popular Searches'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(popularSearches[language] || popularSearches.ru).map(search => (
                          <button
                            key={search}
                            onClick={() => handleQuickSearch(search)}
                            className="px-3 py-1.5 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        {language === 'ru' ? 'Быстрые переходы' : 'Quick Actions'}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {searchItems
                          .filter(item => item.type === 'page')
                          .slice(0, 6)
                          .map(item => {
                            const Icon = getIconByName(item.icon || 'BarChart3');
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelect(item as any)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                                    {getText(item as any, 'title')}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {getText(item as any, 'description')}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ru' 
                        ? 'Попробуйте изменить запрос или использовать другие ключевые слова' 
                        : 'Try changing your query or using different keywords'}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(groupedResults).map(([type, items]) => (
                      <div key={type} className="px-3 py-2">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 px-2 flex items-center gap-2">
                          {language === 'en' ? searchFilters[type as SearchFilter].en : searchFilters[type as SearchFilter].ru}
                          <span className="text-gray-400">({items.length})</span>
                        </h3>
                        {items.map((item, idx) => {
                          const Icon = getIconByName(item.icon || 'BarChart3');
                          const flatIndex = flatResults.findIndex(r => r.id === item.id);
                          const isSelected = flatIndex === selectedIndex;
                          const title = getText(item, 'title');
                          const description = getText(item, 'description');

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                isSelected
                                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                  : getTypeColor(item.type)
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className={`font-medium truncate ${
                                  isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {highlightText(title, query, item.positions || []).map((text, i) => 
                                    i % 2 === 1 ? (
                                      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">{text}</mark>
                                    ) : (
                                      <span key={i}>{text}</span>
                                    )
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {highlightText(description, query, item.positions || []).map((text, i) => 
                                    i % 2 === 1 ? (
                                      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">{text}</mark>
                                    ) : (
                                      <span key={i}>{text}</span>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                    <span className="text-sm">{language === 'ru' ? 'Перейти' : 'Go'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </div>
                                )}
                                <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                  {item.score}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 corporate:border-slate-600 bg-gray-50 dark:bg-gray-800/50 corporate:bg-slate-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd>
                      <span className="ml-1">{language === 'ru' ? 'для навигации' : 'to navigate'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd>
                      <span className="ml-1">{language === 'ru' ? 'для выбора' : 'to select'}</span>
                    </span>
                  </div>
                  <span>
                    {results.length > 0 && (
                      <>{results.length} {language === 'ru' ? 'результатов' : 'results'}</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Helper функции
function getIconByName(name: string) {
  const icons: Record<string, React.FC<any>> = {
    BarChart3: BarChart3,
    TrendingUp: TrendingUp,
    Package: Package,
    Users: Users,
    FileText: FileText,
    Settings: Settings,
    User: User,
    ShoppingCart: ShoppingCart,
    Bell: Bell,
    Shield: Shield,
    Key: Key,
    HelpCircle: HelpCircle,
  };
  return icons[name] || BarChart3;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    page: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    user: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    order: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    product: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    action: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    setting: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    help: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  };
  return colors[type] || colors.page;
}
