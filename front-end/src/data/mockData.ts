import type { User, Product, Order, Report, Dashboard, Notification, Integration, ApiKey, Role } from '../types';

// Пользователи
export const users: User[] = [
  { id: 1, name: 'Иванов Иван', nameEn: 'Ivanov Ivan', email: 'admin@company.ru', role: 'admin', createdAt: '2024-01-15', lastLogin: '2024-03-31 14:30' },
  { id: 2, name: 'Петрова Анна', nameEn: 'Petrova Anna', email: 'petrova@company.ru', role: 'manager', createdAt: '2024-01-20', lastLogin: '2024-03-31 12:15' },
  { id: 3, name: 'Сидоров Константин', nameEn: 'Sidorov Konstantin', email: 'sidorov@company.ru', role: 'analyst', createdAt: '2024-02-01', lastLogin: '2024-03-31 09:45' },
  { id: 4, name: 'Козлова Елена', nameEn: 'Kozlova Elena', email: 'kozlova@company.ru', role: 'viewer', createdAt: '2024-02-15', lastLogin: '2024-03-30 16:20' },
];

// Товары
export const products: Product[] = [
  { id: 1, name: 'iPhone 15 Pro', nameEn: 'iPhone 15 Pro', category: 'Смартфоны', price: 149990, stock: 45, status: 'active', image: '📱', description: 'Флагманский смартфон Apple', descriptionEn: 'Apple flagship smartphone' },
  { id: 2, name: 'MacBook Pro 14"', nameEn: 'MacBook Pro 14"', category: 'Ноутбуки', price: 299990, stock: 12, status: 'active', image: '💻', description: 'Профессиональный ноутбук', descriptionEn: 'Professional laptop' },
  { id: 3, name: 'AirPods Pro 2', nameEn: 'AirPods Pro 2', category: 'Аудио', price: 24990, stock: 156, status: 'active', image: '🎧', description: 'Беспроводные наушники', descriptionEn: 'Wireless headphones' },
  { id: 4, name: 'iPad Air', nameEn: 'iPad Air', category: 'Планшеты', price: 79990, stock: 0, status: 'archived', image: '📟', description: 'Планшет Apple', descriptionEn: 'Apple tablet' },
  { id: 5, name: 'Apple Watch Ultra', nameEn: 'Apple Watch Ultra', category: 'Часы', price: 89990, stock: 35, status: 'active', image: '⌚', description: 'Умные часы', descriptionEn: 'Smart watch' },
  { id: 6, name: 'Samsung Galaxy S24', nameEn: 'Samsung Galaxy S24', category: 'Смартфоны', price: 129990, stock: 28, status: 'draft', image: '📱', description: 'Флагман Samsung', descriptionEn: 'Samsung flagship' },
  { id: 7, name: 'Sony WH-1000XM5', nameEn: 'Sony WH-1000XM5', category: 'Аудио', price: 34990, stock: 55, status: 'active', image: '🎧', description: 'Наушники с шумоподавлением', descriptionEn: 'Noise cancelling headphones' },
  { id: 8, name: 'Dell XPS 15', nameEn: 'Dell XPS 15', category: 'Ноутбуки', price: 189990, stock: 8, status: 'active', image: '💻', description: 'Ультратонкий ноутбук', descriptionEn: 'Ultraportable laptop' },
];

// Заказы
export const orders: Order[] = [
  { id: 1, orderNumber: '#12345', customerName: 'Иванов И.', customerNameEn: 'Ivanov I.', amount: 15000, status: 'delivered', createdAt: '2024-03-28', items: 2 },
  { id: 2, orderNumber: '#12344', customerName: 'Петрова А.', customerNameEn: 'Petrova A.', amount: 8500, status: 'processing', createdAt: '2024-03-29', items: 1 },
  { id: 3, orderNumber: '#12343', customerName: 'Сидоров К.', customerNameEn: 'Sidorov K.', amount: 22000, status: 'pending', createdAt: '2024-03-30', items: 3 },
  { id: 4, orderNumber: '#12342', customerName: 'Козлова Е.', customerNameEn: 'Kozlova E.', amount: 45000, status: 'shipped', createdAt: '2024-03-27', items: 2 },
  { id: 5, orderNumber: '#12341', customerName: 'Смирнов П.', customerNameEn: 'Smirnov P.', amount: 12000, status: 'cancelled', createdAt: '2024-03-26', items: 1 },
];

// Отчёты
export const reports: Report[] = [
  { id: 1, name: 'Отчёт по продажам - Январь 2024', nameEn: 'Sales Report - January 2024', type: 'Продажи', typeEn: 'Sales', status: 'completed', createdAt: '2 часа назад', size: '2.4 MB', author: 'Администратор', authorEn: 'Administrator' },
  { id: 2, name: 'Аналитика пользователей Q4', nameEn: 'User Analytics Q4', type: 'Пользователи', typeEn: 'Users', status: 'completed', createdAt: '5 часов назад', size: '1.8 MB', author: 'Аналитик', authorEn: 'Analyst' },
  { id: 3, name: 'Финансовый отчёт - Декабрь', nameEn: 'Financial Report - December', type: 'Финансы', typeEn: 'Finance', status: 'processing', createdAt: '30 мин назад', size: '-', author: 'Администратор', authorEn: 'Administrator' },
  { id: 4, name: 'Возвраты и рекламации', nameEn: 'Returns and Claims', type: 'Продажи', typeEn: 'Sales', status: 'completed', createdAt: '1 день назад', size: '856 KB', author: 'Менеджер', authorEn: 'Manager' },
  { id: 5, name: 'Инвентаризация склада', nameEn: 'Warehouse Inventory', type: 'Товары', typeEn: 'Products', status: 'failed', createdAt: '2 дня назад', size: '-', author: 'Менеджер', authorEn: 'Manager' },
  { id: 6, name: 'Маркетинговая аналитика', nameEn: 'Marketing Analytics', type: 'Маркетинг', typeEn: 'Marketing', status: 'completed', createdAt: '3 дня назад', size: '3.2 MB', author: 'Аналитик', authorEn: 'Analyst' },
];

// Дашборды
export const dashboards: Dashboard[] = [
  { id: 'sales-overview', title: 'Обзор продаж', titleEn: 'Sales Overview', description: 'Обзор продаж по категориям и регионам', descriptionEn: 'Sales overview by categories and regions' },
  { id: 'inventory-status', title: 'Статус запасов', titleEn: 'Inventory Status', description: 'Статус запасов и остатки на складах', descriptionEn: 'Inventory status and warehouse stock' },
  { id: 'promo-efficiency', title: 'Эффективность промо', titleEn: 'Promo Efficiency', description: 'Эффективность промоакций и скидок', descriptionEn: 'Promotions and discounts effectiveness' },
];

// Уведомления
export const notifications: Notification[] = [
  { id: 1, title: 'Новый заказ', titleEn: 'New Order', message: 'Заказ #12345 ожидает обработки', messageEn: 'Order #12345 awaiting processing', type: 'info', category: 'sales', read: false, createdAt: '2024-03-31 14:30' },
  { id: 2, title: 'Ошибка синхронизации', titleEn: 'Sync Error', message: 'Не удалось синхронизировать с 1С', messageEn: 'Failed to sync with 1C', type: 'error', category: 'system', read: false, createdAt: '2024-03-31 13:15' },
  { id: 3, title: 'Новый пользователь', titleEn: 'New User', message: 'Зарегистрирован новый пользователь', messageEn: 'New user registered', type: 'success', category: 'users', read: true, createdAt: '2024-03-31 10:00' },
  { id: 4, title: 'Предупреждение', titleEn: 'Warning', message: 'Заканчивается место на диске', messageEn: 'Running out of disk space', type: 'warning', category: 'alerts', read: true, createdAt: '2024-03-30 18:45' },
];

// Интеграции
export const integrations: Integration[] = [
  { id: 'superset', name: 'Apache Superset', description: 'Визуализация данных и построение дашбордов', descriptionEn: 'Data visualization and dashboards', icon: 'Database', status: 'connected', statusText: 'Подключено', statusTextEn: 'Connected' },
  { id: 'telegram', name: 'Telegram Bot', description: 'Уведомления и команды через Telegram', descriptionEn: 'Notifications and commands via Telegram', icon: 'MessageSquare', status: 'connected', statusText: 'Активен', statusTextEn: 'Active' },
  { id: '1c', name: '1С:Предприятие', description: 'Синхронизация товаров и заказов', descriptionEn: 'Products and orders synchronization', icon: 'Server', status: 'error', statusText: 'Ошибка синхронизации', statusTextEn: 'Sync Error' },
  { id: 'cdek', name: 'СДЭК', description: 'Расчёт и отслеживание доставки', descriptionEn: 'Delivery calculation and tracking', icon: 'Truck', status: 'connected', statusText: 'Подключено', statusTextEn: 'Connected' },
  { id: 'yookassa', name: 'ЮKassa', description: 'Приём онлайн-платежей', descriptionEn: 'Online payments processing', icon: 'CreditCard', status: 'disconnected', statusText: 'Не подключено', statusTextEn: 'Not Connected' },
];

// API ключи
export const apiKeys: ApiKey[] = [
  { id: '1', name: 'Production API Key', keyValue: 'mk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', created: '15.01.2024', lastUsed: 'Сегодня, 14:32', lastUsedEn: 'Today, 14:32' },
  { id: '2', name: 'Development API Key', keyValue: 'mk_dev_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4', created: '10.12.2023', lastUsed: 'Вчера, 09:15', lastUsedEn: 'Yesterday, 09:15' },
];

// Роли
export const roles: Role[] = [
  { id: 'admin', name: 'Администратор', nameEn: 'Administrator', description: 'Полный доступ ко всем функциям системы', descriptionEn: 'Full access to all system features', permissions: ['edit_users', 'settings', 'view_financials', 'edit_products', 'export_data', 'roles', 'api'], color: 'bg-red-500' },
  { id: 'analyst', name: 'Аналитик', nameEn: 'Analyst', description: 'Просмотр аналитики и создание отчётов', descriptionEn: 'View analytics and create reports', permissions: ['view_analytics', 'create_reports', 'export_data', 'view_financials', 'view_dashboards'], color: 'bg-blue-500' },
  { id: 'manager', name: 'Менеджер', nameEn: 'Manager', description: 'Управление товарами и заказами', descriptionEn: 'Product and order management', permissions: ['edit_products', 'edit_orders', 'promotions', 'view_customers'], color: 'bg-green-500' },
  { id: 'viewer', name: 'Наблюдатель', nameEn: 'Viewer', description: 'Только просмотр основной информации', descriptionEn: 'Read-only access to basic information', permissions: ['view_dashboard', 'view_products'], color: 'bg-gray-500' },
];

// Категории товаров
export const productCategories = ['Все', 'Смартфоны', 'Ноутбуки', 'Планшеты', 'Аудио', 'Часы'];
export const productCategoriesEn = ['All', 'Smartphones', 'Laptops', 'Tablets', 'Audio', 'Watches'];

// Типы отчётов
export const reportTypes = ['Все', 'Продажи', 'Пользователи', 'Финансы', 'Товары', 'Маркетинг'];
export const reportTypesEn = ['All', 'Sales', 'Users', 'Finance', 'Products', 'Marketing'];
