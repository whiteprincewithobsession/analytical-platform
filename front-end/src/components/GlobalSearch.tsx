import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, X, FileText, Users, ShoppingCart, BarChart3, Settings, Package,
  Clock, ArrowRight, Command, Hash, User, TrendingUp, Bell, HelpCircle,
  Shield, Key, Star, Filter, Zap, ChevronRight, Sparkles, ArrowUpRight,
  Layers, Globe, Moon, Sun, Monitor, Languages, LogOut
} from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useSearch } from '../hooks/useSearch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { searchItems, popularSearches, searchFilters, type SearchFilter } from '../data/searchItems';

interface GlobalSearchProps {
  onNavigate?: (path: string) => void;
  onOpenSettings?: (tab?: string) => void;
  onOpenHelp?: () => void;
}


interface CommandItem {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  section: string;
  shortcut?: string[];
  action: () => void;
  keywords: string[];
}

export function GlobalSearch({ onNavigate, onOpenSettings, onOpenHelp }: GlobalSearchProps) {
  const { language, t, setLanguage, theme, setTheme } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [recentSearches, setRecentSearches] = useLocalStorage<Array<{ q: string; ts: number }>>('recent_searches_v2', []);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction, isOpen]);
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
  const modifierKey = isMac ? '⌘' : 'Ctrl';


  const { results, groupedResults } = useSearch({
    query: isCommandMode ? query.slice(1) : query,
    items: isCommandMode ? [] : searchItems,
    filter: activeFilter,
    language,
    limit: 12,
  });


  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'theme-light', name: 'Светлая тема', nameEn: 'Light Theme',
      icon: 'Sun', section: t('common.theme'), shortcut: [], keywords: ['light', 'светлая', 'тема', 'theme'],
      action: () => setTheme('light')
    },
    {
      id: 'theme-dark', name: 'Тёмная тема', nameEn: 'Dark Theme',
      icon: 'Moon', section: t('common.theme'), shortcut: [], keywords: ['dark', 'тёмная', 'тема', 'theme'],
      action: () => setTheme('dark')
    },
    {
      id: 'theme-corporate', name: 'Корпоративная тема', nameEn: 'Corporate Theme',
      icon: 'Monitor', section: t('common.theme'), shortcut: [], keywords: ['corporate', 'корпоративная', 'тема', 'theme'],
      action: () => setTheme('corporate')
    },
    {
      id: 'lang-ru', name: 'Русский язык', nameEn: 'Russian Language',
      icon: 'Globe', section: t('common.language'), shortcut: [], keywords: ['русский', 'russian', 'язык', 'language', 'ru'],
      action: () => setLanguage('ru')
    },
    {
      id: 'lang-en', name: 'English', nameEn: 'English Language',
      icon: 'Globe', section: t('common.language'), shortcut: [], keywords: ['english', 'английский', 'язык', 'language', 'en'],
      action: () => setLanguage('en')
    },
    {
      id: 'settings-security', name: 'Настройки безопасности', nameEn: 'Security Settings',
      icon: 'Shield', section: t('nav.settings'), shortcut: [], keywords: ['security', 'безопасность', 'пароль', 'password'],
      action: () => onOpenSettings?.('security')
    },
    {
      id: 'settings-profile', name: 'Настройки профиля', nameEn: 'Profile Settings',
      icon: 'User', section: t('nav.settings'), shortcut: [], keywords: ['profile', 'профиль', 'настройки'],
      action: () => onOpenSettings?.('profile')
    },
    {
      id: 'settings-api', name: 'API ключи', nameEn: 'API Keys',
      icon: 'Key', section: t('nav.settings'), shortcut: [], keywords: ['api', 'ключи', 'keys'],
      action: () => onOpenSettings?.('api')
    },
    {
      id: 'help', name: 'Справка и поддержка', nameEn: 'Help & Support',
      icon: 'HelpCircle', section: t('common.help'), shortcut: ['?'], keywords: ['help', 'справка', 'помощь', 'support'],
      action: () => onOpenHelp?.()
    },
    {
      id: 'logout', name: 'Выйти из системы', nameEn: 'Logout',
      icon: 'LogOut', section: t('auth.logout'), shortcut: [], keywords: ['logout', 'выйти', 'выход'],
      action: () => {
        sessionStorage.removeItem('superset_authenticated');
        localStorage.removeItem('admin-user');
        fetch('/logout/', { credentials: 'include', redirect: 'manual' })
          .catch(() => {})
          .finally(() => window.location.reload());
      }
    },
  ], [t, language]);


  const filteredCommands = useMemo(() => {
    if (!query.startsWith('>') || query.length < 2) return commands;
    const q = query.slice(1).toLowerCase();
    return commands.filter(cmd =>
      cmd.name.toLowerCase().includes(q) ||
      cmd.nameEn.toLowerCase().includes(q) ||
      cmd.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [query, commands]);


  const recentItems = useMemo(() =>
    recentSearches.slice(0, 5).map(s => s.q),
    [recentSearches]
  );


  const saveRecentSearch = useCallback((search: string) => {
    const normalized = search.trim().toLowerCase();
    if (!normalized || normalized.startsWith('>')) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.q.toLowerCase() !== normalized);
      return [{ q: search, ts: Date.now() }, ...filtered].slice(0, 10);
    });
  }, [setRecentSearches]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => { if (prev) { setQuery(''); setIsCommandMode(false); } return !prev; });
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setIsCommandMode(false);
      }

      if (isOpen && e.key === '>' && query === '') {
        e.preventDefault();
        setIsCommandMode(true);
      }

      if (isOpen && isCommandMode && query === '>' && e.key === 'Backspace') {
        e.preventDefault();
        setIsCommandMode(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCommandMode, query]);


  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);


  useEffect(() => {
    setSelectedIndex(0);

    const selected = resultsRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [query, activeFilter]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = isCommandMode ? filteredCommands.length : results.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, totalItems - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCommandMode) {
        setPendingAction(() => filteredCommands[selectedIndex]?.action);
        setIsOpen(false);
        setQuery('');
        setIsCommandMode(false);
      } else if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
    if (e.key === 'Tab' && !isCommandMode && query === '') {
      e.preventDefault();
      setIsCommandMode(true);
      setQuery('>');
    }
  };

  const handleSelect = (result: typeof results[0]) => {
    saveRecentSearch(result.title);
    setIsOpen(false);
    setQuery('');

    if (result.type === 'page' && result.path && onNavigate) {
      onNavigate(result.path);
    } else if (result.type === 'setting' && onOpenSettings) {
      onOpenSettings();
    } else if (result.type === 'help' && onOpenHelp) {
      onOpenHelp();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    setIsCommandMode(false);
  };


  const getIcon = (name: string) => {
    const icons: Record<string, React.FC<any>> = {
      BarChart3, TrendingUp, Package, Users, FileText, Settings, User,
      ShoppingCart, Bell, Shield, Key, HelpCircle, Sun, Moon, Monitor,
      Globe, LogOut, Sparkles, Zap, Layers
    };
    return icons[name] || BarChart3;
  };


  const typeColors: Record<string, string> = {
    page: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    user: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    order: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    product: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    action: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    setting: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    help: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  };


  const getText = (item: any, field: string): string => {
    if (language === 'en' && item[`${field}En`]) return item[`${field}En`];
    return item[field] || '';
  };


  const highlight = (text: string, q: string, positions: number[] = []) => {
    if (!q || positions.length === 0) return <span>{text}</span>;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    positions.forEach(pos => {
      if (pos > lastIdx) parts.push(<span key={`t-${lastIdx}`}>{text.slice(lastIdx, pos)}</span>);
      parts.push(<mark key={`h-${pos}`} className="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">{text[pos]}</mark>);
      lastIdx = pos + 1;
    });
    if (lastIdx < text.length) parts.push(<span key={`e-${lastIdx}`}>{text.slice(lastIdx)}</span>);
    return <>{parts}</>;
  };

  return (
    <>
      {}
      <div className="flex-1 max-w-md mx-8">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 transition-all hover:shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left text-sm">{language === 'ru' ? 'Поиск...' : 'Search...'}</span>
          <div className="flex items-center gap-0.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-500">{modifierKey}</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-500">K</kbd>
          </div>
        </button>
      </div>

      {}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={handleClose} />
          <div className="fixed inset-x-4 top-[15vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 animate-in zoom-in-95">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden ring-1 ring-black/5">

              {}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
                {isCommandMode ? (
                  <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => {
                    const v = e.target.value;
                    setQuery(isCommandMode && !v.startsWith('>') ? '>' + v : v);
                    if (!v.startsWith('>') && isCommandMode) setIsCommandMode(false);
                    if (v === '>' && !isCommandMode) setIsCommandMode(true);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={isCommandMode
                    ? (language === 'ru' ? 'Введите команду...' : 'Type a command...')
                    : (language === 'ru' ? 'Поиск по всему...' : 'Search everything...')}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
                />
                <div className="flex items-center gap-1.5">
                  {query && (
                    <button onClick={() => { setQuery(''); setIsCommandMode(false); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">ESC</kbd>
                </div>
              </div>

              {}
              {!isCommandMode && query.trim() !== '' && (
                <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mr-1" />
                  {Object.entries(searchFilters).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key as SearchFilter)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                        activeFilter === key
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600/60'
                      }`}
                    >
                      {language === 'en' ? label.en : label.ru}
                    </button>
                  ))}
                </div>
              )}

              {}
              <div ref={scrollContainerRef} className="max-h-[50vh] overflow-y-auto overscroll-contain">
                {query.trim() === '' && !isCommandMode ? (
                  <div className="p-3">
                    {}
                    <div className="mb-3">
                      <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">
                        {language === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
                      </h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { path: 'overview', icon: BarChart3, label: language === 'ru' ? 'Обзор' : 'Overview', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
                          { path: 'dashboards', icon: Layers, label: language === 'ru' ? 'Дашборды' : 'Dashboards', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
                          { path: 'sales', icon: TrendingUp, label: language === 'ru' ? 'Продажи' : 'Sales', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                          { path: 'products', icon: Package, label: language === 'ru' ? 'Товары' : 'Products', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
                          { path: 'users', icon: Users, label: language === 'ru' ? 'Пользователи' : 'Users', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
                          { path: 'settings', icon: Settings, label: language === 'ru' ? 'Настройки' : 'Settings', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
                        ].map(item => (
                          <button
                            key={item.path}
                            onClick={() => { onNavigate?.(item.path); handleClose(); }}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                          >
                            <div className={`p-1.5 rounded-md ${item.color} group-hover:scale-110 transition-transform`}>
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                              {item.label}
                            </span>
                            <ArrowUpRight className="w-3 h-3 text-gray-300 dark:text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    {recentItems.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between px-3 mb-1.5">
                          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {language === 'ru' ? 'Недавние' : 'Recent'}
                          </h3>
                          <button onClick={() => setRecentSearches([])} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            {language === 'ru' ? 'Очистить' : 'Clear'}
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {recentItems.map(s => (
                            <button
                              key={s}
                              onClick={() => { setQuery(s); setSelectedIndex(0); inputRef.current?.focus(); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                            >
                              <Clock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{s}</span>
                              <ArrowUpRight className="w-3 h-3 text-gray-300 dark:text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {}
                    <div>
                      <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        {language === 'ru' ? 'Популярное' : 'Popular'}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 px-3">
                        {(popularSearches[language] || popularSearches.ru).map(s => (
                          <button
                            key={s}
                            onClick={() => { setQuery(s); setSelectedIndex(0); inputRef.current?.focus(); }}
                            className="px-2.5 py-1 text-[11px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    <div className="mt-3 mx-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50">
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                        {language === 'ru'
                          ? 'Нажмите <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] mx-0.5">Tab</kbd> для режима команд'
                          : 'Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[10px] mx-0.5">Tab</kbd> for command mode'}
                      </p>
                    </div>
                  </div>
                ) : isCommandMode ? (
                  filteredCommands.length === 0 ? (
                    <div className="p-10 text-center">
                      <Sparkles className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        {language === 'ru' ? 'Команда не найдена' : 'No command found'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        {language === 'ru' ? 'Команды' : 'Commands'}
                      </h3>
                      {filteredCommands.map((cmd, idx) => {
                        const Icon = getIcon(cmd.icon);
                        return (
                          <button
                            key={cmd.id}
                            data-selected={idx === selectedIndex ? 'true' : undefined}
                            onClick={() => {
                              setPendingAction(() => cmd.action);
                              setIsOpen(false);
                              setQuery('');
                              setIsCommandMode(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                              idx === selectedIndex
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className={`p-1.5 rounded-md ${
                              idx === selectedIndex
                                ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{language === 'en' ? cmd.nameEn : cmd.name}</div>
                              <div className="text-[11px] text-gray-400 dark:text-gray-500">{cmd.section}</div>
                            </div>
                            {idx === selectedIndex && (
                              <div className="flex items-center gap-0.5 text-indigo-400">
                                <span className="text-[10px]">{language === 'ru' ? 'Выполнить' : 'Run'}</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : results.length === 0 ? (
                  <div className="p-10 text-center">
                    <Search className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results'}
                    </p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">
                      {language === 'ru' ? 'Попробуйте другой запрос' : 'Try a different query'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {Object.entries(groupedResults).map(([type, items]) => (
                      <div key={type} className="mb-1">
                        <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 py-1.5 flex items-center gap-1.5">
                          {language === 'en' ? searchFilters[type as SearchFilter].en : searchFilters[type as SearchFilter].ru}
                          <span className="text-gray-300 dark:text-gray-600">({items.length})</span>
                        </h3>
                        <div className="space-y-0.5">
                          {items.map((item) => {
                            const Icon = getIcon(item.icon || 'BarChart3');
                            const flatResults = Object.values(groupedResults).flat();
                            const flatIdx = flatResults.findIndex(r => r.id === item.id);
                            const isSelected = flatIdx === selectedIndex;
                            const title = getText(item, 'title');
                            const description = getText(item, 'description');

                            return (
                              <button
                                key={item.id}
                                data-selected={isSelected ? 'true' : undefined}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(flatIdx)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left group ${
                                  isSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                              >
                                <div className={`p-1.5 rounded-md transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-500'
                                    : typeColors[item.type] || typeColors.page
                                }`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium truncate ${
                                    isSelected ? 'text-indigo-800 dark:text-indigo-200' : 'text-gray-800 dark:text-gray-200'
                                  }`}>
                                    {highlight(title, query, item.positions || [])}
                                  </div>
                                  {description && (
                                    <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                      {highlight(description, query, [])}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[item.type] || typeColors.page}`}>
                                    {language === 'en' ? searchFilters[item.type as SearchFilter]?.en || item.type : searchFilters[item.type as SearchFilter]?.ru || item.type}
                                  </span>
                                  <ArrowUpRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/50 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-sm text-[10px]">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-sm text-[10px]">↓</kbd>
                    <span className="ml-0.5">{language === 'ru' ? 'навигация' : 'navigate'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-sm text-[10px]">↵</kbd>
                    <span className="ml-0.5">{language === 'ru' ? 'выбрать' : 'select'}</span>
                  </span>
                  {!isCommandMode && (
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-sm text-[10px]">Tab</kbd>
                      <span className="ml-0.5">{language === 'ru' ? 'команды' : 'commands'}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-sm text-[10px]">{modifierKey}</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 shadow-sm text-[10px]">K</kbd>
                    <span className="ml-0.5">{language === 'ru' ? 'поиск' : 'search'}</span>
                  </span>
                </div>
                {!isCommandMode && results.length > 0 && (
                  <span>{results.length} {language === 'ru' ? 'результатов' : 'results'}</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
