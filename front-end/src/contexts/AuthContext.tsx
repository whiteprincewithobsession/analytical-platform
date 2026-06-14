import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

export type UserRole = 'admin' | 'analyst' | 'manager' | 'spectator';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
  setActivityLogger: (logFn: (type: string, details?: string) => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserRole, User> = {
  admin: { id: '1', name: 'Администратор', email: 'admin@marketplace.ru', role: 'admin' },
  analyst: { id: '2', name: 'Аналитик', email: 'analyst@marketplace.ru', role: 'analyst' },
  manager: { id: '3', name: 'Менеджер', email: 'manager@marketplace.ru', role: 'manager' },
  spectator: { id: '4', name: 'Наблюдатель', email: 'viewer@marketplace.ru', role: 'spectator' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('admin-user');
    return saved ? JSON.parse(saved) : null;
  });

  const activityLoggerRef = useRef<((type: string, details?: string) => void) | null>(null);

  const setActivityLogger = useCallback((logFn: (type: string, details?: string) => void) => {
    activityLoggerRef.current = logFn;
  }, []);

  const login = (role: UserRole) => {
    const userData = mockUsers[role];
    setUser(userData);
    localStorage.setItem('admin-user', JSON.stringify(userData));
  };

  const logout = () => {
    if (activityLoggerRef.current) {
      activityLoggerRef.current('logout', `User: ${user?.name}`);
    }
    setUser(null);
    localStorage.removeItem('admin-user');
    sessionStorage.removeItem('superset_authenticated');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, setActivityLogger }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
