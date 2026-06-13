import React, { useState } from 'react';
import { BarChart3, Eye, EyeOff, Shield, TrendingUp, Users, Eye as EyeIcon, Sun, Moon } from 'lucide-react';

const ROLE_MAP: Record<string, { id: string; name: string; nameEn: string; icon: any; color: string; desc: string }> = {
  admin: { id: 'admin', name: 'Admin', nameEn: 'Admin', icon: Shield, color: 'from-red-500 to-rose-600', desc: 'Full access' },
  analyst: { id: 'analyst', name: 'Analyst', nameEn: 'Analyst', icon: TrendingUp, color: 'from-blue-500 to-cyan-600', desc: 'Analytics & reports' },
  manager: { id: 'manager', name: 'Manager', nameEn: 'Manager', icon: Users, color: 'from-emerald-500 to-teal-600', desc: 'Product & order management' },
  spectator: { id: 'spectator', name: 'Spectator', nameEn: 'Spectator', icon: EyeIcon, color: 'from-gray-500 to-gray-600', desc: 'Read-only access' },
};

interface SupersetLoginGateProps {
  children?: React.ReactNode;
  onLoginSuccess: () => void;
}

export const SupersetLoginGate: React.FC<SupersetLoginGateProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLightTheme, setIsLightTheme] = useState(false);

  const detectRole = (roles: string[], uname: string): string => {
    const rl = roles.map(r => r.toLowerCase());
    if (rl.includes('admin') || uname.toLowerCase() === 'admin') return 'admin';
    if (rl.includes('alpha') || rl.includes('sql_lab') || rl.includes('bi developer') || rl.includes('data analyst')) return 'analyst';
    if (rl.includes('gamma') || rl.includes('sql developer')) return 'manager';
    return 'spectator';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginPageRes = await fetch('/login/', { credentials: 'include' });
      const loginHtml = await loginPageRes.text();
      const csrfMatch = loginHtml.match(/name="csrf_token"\s+value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('csrf_token', csrfToken);

      await fetch('/login/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        redirect: 'manual',
      });

      const meRes = await fetch('/api/v1/me/', { credentials: 'include' });
      if (meRes.ok) {
        const meData = await meRes.json();
        const supersetUser = meData.result || {};

        // КРИТИЧЕСКАЯ ПРОВЕРКА БЕЗОПАСНОСТИ:
        // Если пользователь ввел 'random', а сервер вернул 'admin' (старая сессия),
        // значит логин не удался. Мы должны запретить вход.
        if (supersetUser.username && supersetUser.username.toLowerCase() !== username.toLowerCase()) {
          setError('Неверный логин или пароль');
          // Принудительно убиваем сессию, чтобы не смущать пользователя
          await fetch('/logout/', { credentials: 'include' });
          return;
        }

        // Validation: user_id must exist
        if (!supersetUser.user_id && !supersetUser.username) {
          setError('Неверный логин или пароль');
          return;
        }

        const roles = (supersetUser.roles || []).map((r: any) => r.name);
        const appRole = detectRole(roles, supersetUser.username || '');
        const roleInfo = ROLE_MAP[appRole];

        localStorage.setItem('admin-user', JSON.stringify({
          id: String(supersetUser.user_id || 1),
          name: `${supersetUser.first_name || ''} ${supersetUser.last_name || ''}`.trim() || supersetUser.username || 'User',
          email: supersetUser.email || '',
          role: roleInfo.id,
        }));

        sessionStorage.setItem('superset_authenticated', 'true');
        onLoginSuccess();
      } else {
        setError('Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
      isLightTheme
        ? 'bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50'
        : 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900'
    }`}>
      <div className="w-full max-w-md">
        {/* Theme toggle button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsLightTheme(!isLightTheme)}
            className={`p-2 rounded-lg transition-all ${
              isLightTheme
                ? 'bg-white/80 hover:bg-white text-indigo-600 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isLightTheme ? 'Темная тема' : 'Светлая тема'}
          >
            {isLightTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${
            isLightTheme
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'
          }`}>
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${isLightTheme ? 'text-indigo-900' : 'text-white'}`}>
            Стратум
          </h1>
          <p className={`mt-2 ${isLightTheme ? 'text-indigo-600' : 'text-indigo-200'}`}>
            Войдите для доступа к системе
          </p>
        </div>

        <div className={`rounded-2xl p-8 shadow-xl border backdrop-blur-lg ${
          isLightTheme
            ? 'bg-white/90 border-indigo-200 shadow-indigo-200/50'
            : 'bg-white/10 border-white/20'
        }`}>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isLightTheme ? 'text-indigo-700' : 'text-indigo-200'
              }`}>Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите логин"
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all ${
                  isLightTheme
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 placeholder-indigo-300'
                    : 'bg-white/10 border-white/20 text-white placeholder-indigo-300'
                }`}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isLightTheme ? 'text-indigo-700' : 'text-indigo-200'
              }`}>Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all pr-12 ${
                    isLightTheme
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 placeholder-indigo-300'
                      : 'bg-white/10 border-white/20 text-white placeholder-indigo-300'
                  }`}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                    isLightTheme ? 'text-indigo-400 hover:text-indigo-600' : 'text-indigo-300 hover:text-white'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          <div className={`mt-6 p-4 rounded-xl border ${
            isLightTheme
              ? 'bg-amber-50 border-amber-200'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <p className={`text-xs ${isLightTheme ? 'text-amber-700' : 'text-amber-200'}`}>
              💡 Роль назначается автоматически на основе ваших прав в Superset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
