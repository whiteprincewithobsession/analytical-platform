import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type ActivityType =
  | 'login'
  | 'logout'
  | 'navigation'
  | 'export'
  | 'settings_change'
  | 'theme_change'
  | 'language_change'
  | 'search'
  | 'report_create'
  | 'report_export'
  | 'superset_view'
  | 'product_edit'
  | 'user_action'
  | 'notification_view'
  | 'custom';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  actionKey: string;
  details?: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

interface ActivityContextType {
  log: (entry: Omit<ActivityEntry, 'id' | 'timestamp' | 'userAgent' | 'ip' | 'userId'>) => void;
  entries: ActivityEntry[];
  clear: () => void;
  getRecent: (limit?: number) => ActivityEntry[];
}

const ActivityContext = createContext<ActivityContextType | null>(null);

const STORAGE_KEY = 'app_activity_log';
const MAX_ENTRIES = 100;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getSimpleIP(): string {
  // Mock IP — в реальном приложении можно получать с сервера
  return '192.168.1.' + Math.floor(Math.random() * 254 + 1);
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ActivityEntry[];
      }
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch { /* ignore */ }
  }, [entries]);

  const log = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp' | 'userAgent' | 'ip' | 'userId'>) => {
    const now = new Date();
    const newEntry: ActivityEntry = {
      ...entry,
      id: generateId(),
      timestamp: now.toISOString(),
      ip: getSimpleIP(),
      userAgent: navigator.userAgent.slice(0, 120),
    };

    setEntries(prev => {
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getRecent = useCallback((limit = 50) => {
    return entries.slice(0, limit);
  }, [entries]);

  return (
    <ActivityContext.Provider value={{ log, entries, clear, getRecent }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity(): ActivityContextType {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return ctx;
}
