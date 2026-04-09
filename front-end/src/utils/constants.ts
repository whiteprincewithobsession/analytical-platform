


export const USER_ROLES = {
  ADMIN: 'admin' as const,
  ANALYST: 'analyst' as const,
  MANAGER: 'manager' as const,
  VIEWER: 'viewer' as const,
};


export const ORDER_STATUS = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  SHIPPED: 'shipped' as const,
  DELIVERED: 'delivered' as const,
  CANCELLED: 'cancelled' as const,
  REFUNDED: 'refunded' as const,
};


export const PRODUCT_STATUS = {
  ACTIVE: 'active' as const,
  DRAFT: 'draft' as const,
  ARCHIVED: 'archived' as const,
};


export const REPORT_STATUS = {
  COMPLETED: 'completed' as const,
  PROCESSING: 'processing' as const,
  FAILED: 'failed' as const,
};


export const NOTIFICATION_TYPES = {
  INFO: 'info' as const,
  SUCCESS: 'success' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
};


export const NOTIFICATION_CATEGORIES = {
  SYSTEM: 'system' as const,
  SALES: 'sales' as const,
  USERS: 'users' as const,
  ALERTS: 'alerts' as const,
};


export const LANGUAGES = {
  RU: 'ru' as const,
  EN: 'en' as const,
};


export const DATE_FORMATS = {
  DD_MM_YYYY: 'DD.MM.YYYY' as const,
  MM_DD_YYYY: 'MM/DD/YYYY' as const,
  YYYY_MM_DD: 'YYYY-MM-DD' as const,
};


export const CURRENCIES = {
  RUB: 'RUB' as const,
  USD: 'USD' as const,
  EUR: 'EUR' as const,
};


export const FIRST_DAY_OF_WEEK = {
  MONDAY: 'monday' as const,
  SUNDAY: 'sunday' as const,
};


export const SEARCH_TYPES = {
  PAGE: 'page' as const,
  USER: 'user' as const,
  ORDER: 'order' as const,
  PRODUCT: 'product' as const,
  ACTION: 'action' as const,
  SETTING: 'setting' as const,
  HELP: 'help' as const,
};


export const MODAL_SIZES = {
  SM: 'sm' as const,
  MD: 'md' as const,
  LG: 'lg' as const,
  XL: 'xl' as const,
  FULL: 'full' as const,
};


export const BUTTON_VARIANTS = {
  PRIMARY: 'primary' as const,
  SECONDARY: 'secondary' as const,
  OUTLINE: 'outline' as const,
  GHOST: 'ghost' as const,
  DANGER: 'danger' as const,
};


export const BUTTON_SIZES = {
  SM: 'sm' as const,
  MD: 'md' as const,
  LG: 'lg' as const,
};


export const CARD_VARIANTS = {
  DEFAULT: 'default' as const,
  GRADIENT: 'gradient' as const,
};


export const BADGE_VARIANTS = {
  DEFAULT: 'default' as const,
  SUCCESS: 'success' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
  INFO: 'info' as const,
  PURPLE: 'purple' as const,
};


export const DEFAULT_SETTINGS = {
  LANGUAGE: 'ru' as const,
  DATE_FORMAT: 'DD.MM.YYYY' as const,
  CURRENCY: 'RUB' as const,
  FIRST_DAY_OF_WEEK: 'monday' as const,
  TIMEZONE: 'Europe/Moscow' as const,
};


export const LIMITS = {
  SEARCH_RESULTS: 15,
  RECENT_SEARCHES: 10,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  LOGIN_MAX_ATTEMPTS: 5,
  SESSION_TIMEOUT_MINUTES: 30,
};


export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  REPORTS: '/api/reports',
  ANALYTICS: '/api/analytics',
  SETTINGS: '/api/settings',
};


export const STORAGE_KEYS = {
  AUTH: 'app_auth',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  SETTINGS: 'app_settings',
  RECENT_SEARCHES: 'recent_searches',
};
