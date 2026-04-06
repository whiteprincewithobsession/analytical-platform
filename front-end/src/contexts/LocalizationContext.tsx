import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ruTranslations from '../locales/ru.json';
import enTranslations from '../locales/en.json';

// Типы
export type Language = 'ru' | 'en';
export type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type CurrencyCode = 'RUB' | 'USD' | 'EUR';
export type FirstDayOfWeek = 'monday' | 'sunday';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameEn: string;
  position: 'before' | 'after';
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

interface LanguageConfig {
  code: Language;
  name: string;
  flag: string;
}

interface DateFormatConfig {
  format: DateFormat;
  label: string;
  example: string;
}

interface LocalizationContextType {
  // Текущие настройки
  language: Language;
  dateFormat: DateFormat;
  currency: CurrencyCode;
  firstDayOfWeek: FirstDayOfWeek;
  
  // Конфигурации
  languages: LanguageConfig[];
  dateFormats: DateFormatConfig[];
  currencies: CurrencyConfig[];
  
  // Сеттеры
  setLanguage: (lang: Language) => void;
  setDateFormat: (format: DateFormat) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setFirstDayOfWeek: (day: FirstDayOfWeek) => void;
  
  // Хелперы
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string) => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  getWeekDays: () => string[];
}

// Конфигурации
const languageConfigs: LanguageConfig[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const dateFormatConfigs: DateFormatConfig[] = [
  { format: 'DD.MM.YYYY', label: 'DD.MM.YYYY', example: '31.12.2024' },
  { format: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2024' },
  { format: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-12-31' },
];

const currencyConfigs: CurrencyConfig[] = [
  { 
    code: 'RUB', 
    symbol: '₽', 
    name: 'Российский рубль',
    nameEn: 'Russian Ruble',
    position: 'after', 
    decimals: 0,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  { 
    code: 'USD', 
    symbol: '$', 
    name: 'Доллар США',
    nameEn: 'US Dollar',
    position: 'before', 
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Евро',
    nameEn: 'Euro',
    position: 'after', 
    decimals: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
];

// Словари переводов
const translations: Record<Language, Record<string, any>> = {
  ru: ruTranslations,
  en: enTranslations,
};

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'ru';
  });
  
  const [dateFormat, setDateFormatState] = useState<DateFormat>(() => {
    const saved = localStorage.getItem('app_dateFormat');
    return (saved as DateFormat) || 'DD.MM.YYYY';
  });
  
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('app_currency');
    return (saved as CurrencyCode) || 'RUB';
  });
  
  const [firstDayOfWeek, setFirstDayOfWeekState] = useState<FirstDayOfWeek>(() => {
    const saved = localStorage.getItem('app_firstDayOfWeek');
    return (saved as FirstDayOfWeek) || 'monday';
  });

  // Сохранение в localStorage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
  }, []);

  const setDateFormat = useCallback((format: DateFormat) => {
    setDateFormatState(format);
    localStorage.setItem('app_dateFormat', format);
  }, []);

  const setCurrency = useCallback((curr: CurrencyCode) => {
    setCurrencyState(curr);
    localStorage.setItem('app_currency', curr);
  }, []);

  const setFirstDayOfWeek = useCallback((day: FirstDayOfWeek) => {
    setFirstDayOfWeekState(day);
    localStorage.setItem('app_firstDayOfWeek', day);
  }, []);

  // Установка языка документа
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Функция перевода с поддержкой вложенных ключей и параметров
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback на английский
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Возвращаем ключ, если перевод не найден
          }
        }
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Подстановка параметров
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || `{${paramKey}}`;
      });
    }
    
    return value;
  }, [language]);

  // Форматирование даты
  const formatDate = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    switch (dateFormat) {
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}.${month}.${year}`;
    }
  }, [dateFormat]);

  // Форматирование валюты
  const formatCurrency = useCallback((amount: number): string => {
    const config = currencyConfigs.find(c => c.code === currency) || currencyConfigs[0];
    
    const formattedNumber = amount
      .toFixed(config.decimals)
      .replace('.', config.decimalSeparator)
      .replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
    
    if (config.position === 'before') {
      return `${config.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${config.symbol}`;
    }
  }, [currency]);

  // Форматирование числа
  const formatNumber = useCallback((num: number): string => {
    const config = currencyConfigs.find(c => c.code === currency) || currencyConfigs[0];
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
  }, [currency]);

  // Получение дней недели в правильном порядке
  const getWeekDays = useCallback((): string[] => {
    const days = [
      t('days.mon'),
      t('days.tue'),
      t('days.wed'),
      t('days.thu'),
      t('days.fri'),
      t('days.sat'),
      t('days.sun'),
    ];
    
    if (firstDayOfWeek === 'sunday') {
      return [days[6], ...days.slice(0, 6)];
    }
    return days;
  }, [firstDayOfWeek, t]);

  const value: LocalizationContextType = {
    language,
    dateFormat,
    currency,
    firstDayOfWeek,
    languages: languageConfigs,
    dateFormats: dateFormatConfigs,
    currencies: currencyConfigs,
    setLanguage,
    setDateFormat,
    setCurrency,
    setFirstDayOfWeek,
    t,
    formatDate,
    formatCurrency,
    formatNumber,
    getWeekDays,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
};
