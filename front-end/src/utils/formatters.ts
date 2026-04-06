// Форматирование чисел
export const formatNumber = (num: number, locale = 'ru-RU'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

// Форматирование валюты
export const formatCurrency = (
  amount: number,
  currency: string = 'RUB',
  locale: string = 'ru-RU'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Форматирование даты
export const formatDate = (
  date: Date | string,
  format: string = 'DD.MM.YYYY',
  locale: string = 'ru-RU'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD MMM YYYY':
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    case 'MMMM DD, YYYY':
      return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
    default:
      return `${day}.${month}.${year}`;
  }
};

// Форматирование времени
export const formatTime = (date: Date | string, locale: string = 'ru-RU'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

// Форматирование даты и времени
export const formatDateTime = (
  date: Date | string,
  locale: string = 'ru-RU'
): string => {
  return `${formatDate(date, 'DD.MM.YYYY', locale)} ${formatTime(date, locale)}`;
};

// Относительное время (например, "5 минут назад")
export const formatRelativeTime = (date: Date | string, locale: string = 'ru-RU'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return locale === 'ru' ? 'только что' : 'just now';
  } else if (diffMins < 60) {
    return locale === 'ru'
      ? `${diffMins} мин. назад`
      : `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return locale === 'ru'
      ? `${diffHours} ч. назад`
      : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return locale === 'ru'
      ? `${diffDays} дн. назад`
      : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(d, 'DD.MM.YYYY', locale);
  }
};

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// Форматирование процента
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Форматирование телефона
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1,3})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
  
  if (match) {
    let result = '';
    if (match[1]) result = `+${match[1]}`;
    if (match[2]) result += ` (${match[2]}`;
    if (match[3]) result += `) ${match[3]}`;
    if (match[4]) result += `-${match[4]}`;
    if (match[5]) result += `-${match[5]}`;
    return result;
  }
  
  return phone;
};
