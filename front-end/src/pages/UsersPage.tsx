import { useState } from 'react';
import { Search, Plus, MoreVertical, Shield, Edit, Trash2, Mail } from 'lucide-react';

const users = [
  { id: 1, name: 'Иванов Иван', email: 'ivanov@company.ru', role: 'admin', status: 'active', lastActive: '5 мин назад' },
  { id: 2, name: 'Петрова Анна', email: 'petrova@company.ru', role: 'analyst', status: 'active', lastActive: '1 час назад' },
  { id: 3, name: 'Сидоров Пётр', email: 'sidorov@company.ru', role: 'manager', status: 'active', lastActive: '2 часа назад' },
  { id: 4, name: 'Козлова Елена', email: 'kozlova@company.ru', role: 'viewer', status: 'inactive', lastActive: '3 дня назад' },
  { id: 5, name: 'Новиков Алексей', email: 'novikov@company.ru', role: 'manager', status: 'active', lastActive: '30 мин назад' },
  { id: 6, name: 'Морозова Ольга', email: 'morozova@company.ru', role: 'analyst', status: 'pending', lastActive: 'Никогда' },
];

const roleLabels = {
  admin: 'Администратор',
  analyst: 'Аналитик',
  manager: 'Менеджер',
  viewer: 'Наблюдатель',
};

const roleColors = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  analyst: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  manager: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
};

const statusColors = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  pending: 'bg-amber-500',
};

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск пользователей..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
          <Plus className="w-5 h-5" />
          Добавить пользователя
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className="bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 corporate:border-slate-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      statusColors[user.status as keyof typeof statusColors]
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white corporate:text-white">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {activeMenu === user.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Shield className="w-4 h-4" />
                        Изменить роль
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Mail className="w-4 h-4" />
                        Отправить email
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700" />
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  roleColors[user.role as keyof typeof roleColors]
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {roleLabels[user.role as keyof typeof roleLabels]}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.lastActive}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
