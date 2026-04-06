// Общие типы для приложения

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = 'admin' | 'analyst' | 'manager' | 'viewer';

export interface Product {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  image?: string;
  description?: string;
  descriptionEn?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerNameEn: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  items?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface Report {
  id: number;
  name: string;
  nameEn: string;
  type: string;
  typeEn: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  size: string;
  author: string;
  authorEn: string;
}

export interface Dashboard {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  url?: string;
}

export interface Notification {
  id: number;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'sales' | 'users' | 'alerts';
  read: boolean;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon?: string;
  path?: string;
  keywords: string[];
  priority?: number;
}

export type SearchResultType = 'page' | 'user' | 'order' | 'product' | 'action' | 'setting' | 'help';

export interface Permission {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
}

export interface Role {
  id: UserRole;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  permissions: string[];
  color: string;
}

export interface Settings {
  siteName: string;
  domain: string;
  timezone: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  twoFactorAuth: boolean;
  autoLogout: boolean;
  loginNotifications: boolean;
  passwordMinLength: number;
  maxLoginAttempts: number;
  notifyOrders: boolean;
  notifyErrors: boolean;
  notifyReports: boolean;
  notifyUpdates: boolean;
  notifyReminders: boolean;
  language: 'ru' | 'en';
  dateFormat: string;
  currency: string;
  firstDayOfWeek: 'monday' | 'sunday';
  smtpServer: string;
  smtpPort: number;
  smtpEncryption: 'none' | 'ssl' | 'tls';
  emailFrom: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  descriptionEn: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  statusText: string;
  statusTextEn: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  created: string;
  lastUsed: string;
  lastUsedEn: string;
  expires?: string;
}
