import { useState, useCallback } from 'react';
import type { Settings } from '../types';

const defaultSettings: Settings = {
  siteName: 'Marketplace Admin',
  domain: 'admin.marketplace.ru',
  timezone: 'Europe/Moscow',
  maintenanceMode: false,
  debugMode: false,
  twoFactorAuth: true,
  autoLogout: true,
  loginNotifications: true,
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  notifyOrders: true,
  notifyErrors: true,
  notifyReports: false,
  notifyUpdates: true,
  notifyReminders: true,
  language: 'ru',
  dateFormat: 'DD.MM.YYYY',
  currency: 'RUB',
  firstDayOfWeek: 'monday',
  smtpServer: 'smtp.gmail.com',
  smtpPort: 587,
  smtpEncryption: 'tls',
  emailFrom: 'noreply@marketplace.ru',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('app_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('app_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem('app_settings');
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
  };
}
