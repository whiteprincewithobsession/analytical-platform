import { UserRole } from '../contexts/AuthContext';

// Определяем все возможные разрешения
export type Permission =
  | 'view_dashboard'
  | 'view_dashboards'
  | 'view_sales'
  | 'view_products'
  | 'view_analytics'
  | 'view_reports'
  | 'view_users'
  | 'view_settings'
  | 'edit_products'
  | 'edit_orders'
  | 'edit_users'
  | 'edit_settings'
  | 'export_data'
  | 'create_reports'
  | 'manage_promotions'
  | 'invite_users'
  | 'view_financials'
  | 'view_system_alerts'
  | 'manage_system';

// Матрица разрешений для каждой роли
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_dashboards',
    'view_sales',
    'view_products',
    'view_analytics',
    'view_reports',
    'view_users',
    'view_settings',
    'edit_products',
    'edit_orders',
    'edit_users',
    'edit_settings',
    'export_data',
    'create_reports',
    'manage_promotions',
    'invite_users',
    'view_financials',
    'view_system_alerts',
    'manage_system',
  ],
  analyst: [
    'view_dashboard',
    'view_dashboards',
    'view_sales',
    'view_products',
    'view_analytics',
    'view_reports',
    'export_data',
    'create_reports',
    'view_financials',
  ],
  manager: [
    'view_dashboard',
    'view_dashboards',
    'view_sales',
    'view_products',
    'view_reports',
    'edit_products',
    'edit_orders',
    'manage_promotions',
  ],
  viewer: [
    'view_dashboard',
    'view_dashboards',
    'view_sales',
    'view_products',
  ],
};

// Проверка разрешения
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role].includes(permission);
}

// Проверка нескольких разрешений (все)
export function hasAllPermissions(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every(p => rolePermissions[role].includes(p));
}

// Проверка нескольких разрешений (хотя бы одно)
export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some(p => rolePermissions[role].includes(p));
}

// Описание ролей
export const roleDescriptions: Record<UserRole, {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  capabilities: string[];
  restrictions: string[];
}> = {
  admin: {
    title: 'Администратор',
    titleEn: 'Administrator',
    description: 'Полный доступ ко всем функциям системы',
    descriptionEn: 'Full access to all system features',
    capabilities: [
      'Управление всеми пользователями',
      'Настройка системы',
      'Доступ к финансовым данным',
      'Управление товарами и заказами',
      'Экспорт всех данных',
      'Создание отчётов',
    ],
    restrictions: [],
  },
  analyst: {
    title: 'Аналитик',
    titleEn: 'Analyst',
    description: 'Просмотр данных и аналитики, создание отчётов',
    descriptionEn: 'View data and analytics, create reports',
    capabilities: [
      'Просмотр всей аналитики',
      'Создание отчётов',
      'Экспорт данных',
      'Доступ к финансовым данным',
      'Просмотр продаж и товаров',
    ],
    restrictions: [
      'Нет редактирования товаров',
      'Нет управления пользователями',
      'Нет доступа к настройкам',
    ],
  },
  manager: {
    title: 'Менеджер',
    titleEn: 'Manager',
    description: 'Управление товарами, заказами и акциями',
    descriptionEn: 'Manage products, orders and promotions',
    capabilities: [
      'Редактирование товаров',
      'Обработка заказов',
      'Управление акциями',
      'Просмотр продаж',
      'Создание товаров',
    ],
    restrictions: [
      'Нет доступа к аналитике',
      'Нет экспорта данных',
      'Нет управления пользователями',
      'Нет доступа к настройкам',
    ],
  },
  viewer: {
    title: 'Наблюдатель',
    titleEn: 'Viewer',
    description: 'Только просмотр основной информации',
    capabilities: [
      'Просмотр обзора',
      'Просмотр списка продаж',
      'Просмотр каталога товаров',
    ],
    restrictions: [
      'Нет редактирования данных',
      'Нет экспорта',
      'Нет доступа к аналитике',
      'Нет доступа к отчётам',
      'Нет доступа к пользователям',
      'Нет доступа к настройкам',
    ],
  },
};

// Страницы и требуемые разрешения
export const pagePermissions: Record<string, Permission[]> = {
  overview: ['view_dashboard'],
  dashboards: ['view_dashboards'],
  sales: ['view_sales'],
  products: ['view_products'],
  analytics: ['view_analytics'],
  reports: ['view_reports'],
  users: ['view_users'],
  settings: ['view_settings'],
};
