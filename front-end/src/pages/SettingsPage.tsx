import React, { useState } from 'react';
import {
  Settings, Shield, Bell, Link, Globe, Mail, Key, Users,
  Save, RefreshCw, Eye, EyeOff, Copy, Check, ChevronRight,
  Server, Database, MessageSquare, CreditCard, Truck,
  Plus, Trash2, Edit2, Info, AlertTriangle, Calendar, DollarSign, Languages
} from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { useLocalization } from '../contexts/LocalizationContext';
import type { DateFormat } from '../contexts/LocalizationContext';

interface SettingsSectionProps {
  id: string;
  labelKey: string;
  shortLabelKey?: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

const settingsSections: SettingsSectionProps[] = [
  { id: 'general', labelKey: 'settings.general', shortLabelKey: 'settings.generalShort', descriptionKey: 'settings.generalDesc', icon: <Settings className="w-5 h-5" /> },
  { id: 'security', labelKey: 'settings.security', descriptionKey: 'settings.securityDesc', icon: <Shield className="w-5 h-5" /> },
  { id: 'notifications', labelKey: 'settings.notifications', descriptionKey: 'settings.notificationsDesc', icon: <Bell className="w-5 h-5" /> },
  { id: 'integrations', labelKey: 'settings.integrations', descriptionKey: 'settings.integrationsDesc', icon: <Link className="w-5 h-5" /> },
  { id: 'localization', labelKey: 'settings.localization', descriptionKey: 'settings.localizationDesc', icon: <Globe className="w-5 h-5" /> },
  { id: 'email', labelKey: 'settings.email', shortLabelKey: 'settings.email', descriptionKey: 'settings.emailDesc', icon: <Mail className="w-5 h-5" /> },
  { id: 'api', labelKey: 'settings.api', shortLabelKey: 'settings.api', descriptionKey: 'settings.apiDesc', icon: <Key className="w-5 h-5" /> },
  { id: 'roles', labelKey: 'settings.roles', descriptionKey: 'settings.rolesDesc', icon: <Users className="w-5 h-5" /> },
];

// Компонент кнопки меню с тултипом
const MenuButton: React.FC<{
  section: SettingsSectionProps;
  isActive: boolean;
  onClick: () => void;
  t: (key: string) => string;
}> = ({ section, isActive, onClick, t }) => {
  const label = section.shortLabelKey ? t(section.shortLabelKey) : t(section.labelKey);
  const description = t(section.descriptionKey);

  return (
    <Tooltip
      content={
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-gray-300 text-xs mt-1">{description}</div>
        </div>
      }
      position="right"
      delay={400}
    >
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
          isActive
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}>
          {section.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {label}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
          isActive ? 'text-white rotate-90' : 'text-gray-400'
        }`} />
      </button>
    </Tooltip>
  );
};

// Компонент Toggle с подсказкой
const Toggle: React.FC<{
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ enabled, onChange, label, description, disabled }) => {
  const content = (
    <div 
      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
        disabled 
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
      }`}
    >
      <div className="flex-1 min-w-0 mr-4">
        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (disabled) {
    return (
      <Tooltip content="Недоступно для вашей роли" position="top">
        <div>{content}</div>
      </Tooltip>
    );
  }

  return content;
};

// Компонент секции локализации
const LocalizationSection: React.FC = () => {
  const {
    language,
    setLanguage,
    dateFormat,
    setDateFormat,
    currency,
    setCurrency,
    firstDayOfWeek,
    setFirstDayOfWeek,
    formatDate,
    formatCurrency,
    getWeekDays,
    languages,
    dateFormats,
    currencies,
    t,
  } = useLocalization();

  const today = new Date();
  const exampleAmount = 1234567.89;

  return (
    <div className="space-y-6">
      {/* Информационная панель */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Languages className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300">
              {t('settingsSections.localization.language')}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {language === 'ru' 
                ? 'Настройте язык интерфейса, формат отображения дат, валюту и первый день недели. Изменения применяются мгновенно ко всему приложению.'
                : 'Configure interface language, date format, currency and first day of week. Changes apply instantly across the application.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Язык интерфейса */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('settingsSections.localization.language')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ru' ? 'Выберите язык интерфейса' : 'Select interface language'}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Галочка выбора */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {/* Флаг */}
                    <span className="text-4xl flex-shrink-0">{lang.flag}</span>

                    {/* Информация */}
                    <div className="text-left">
                      <div className="font-bold text-gray-900 dark:text-white text-lg">
                        {lang.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {lang.code === 'ru' ? 'Russian' : 'English'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Формат даты */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('settingsSections.localization.dateFormat')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ru' ? 'Как отображать даты в системе' : 'How to display dates'}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dateFormats.map((fmt) => {
              const details: Record<DateFormat, { name: string; region: string }> = {
                'DD.MM.YYYY': { name: language === 'ru' ? 'Европейский' : 'European', region: language === 'ru' ? 'Россия, Европа' : 'Russia, Europe' },
                'MM/DD/YYYY': { name: language === 'ru' ? 'Американский' : 'American', region: language === 'ru' ? 'США, Канада' : 'USA, Canada' },
                'YYYY-MM-DD': { name: 'ISO 8601', region: language === 'ru' ? 'Международный' : 'International' },
              };
              const isSelected = dateFormat === fmt.format;

              return (
                <button
                  key={fmt.format}
                  onClick={() => setDateFormat(fmt.format)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg ring-2 ring-green-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Галочка выбора */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Формат */}
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold font-mono ${
                      isSelected
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {fmt.format}
                    </span>
                  </div>

                  {/* Название и регион */}
                  <div className="mb-3">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {details[fmt.format].name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {details[fmt.format].region}
                    </div>
                  </div>

                  {/* Пример даты */}
                  <div className={`p-2 rounded-lg text-center ${
                    isSelected
                      ? 'bg-green-100 dark:bg-green-800/30'
                      : 'bg-gray-100 dark:bg-gray-700/50'
                  }`}>
                    <span className={`font-mono text-sm font-medium ${
                      isSelected
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {fmt.example}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{language === 'ru' ? 'Сегодня:' : 'Today:'}</span>{' '}
              <span className="font-mono">{formatDate(today)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Валюта */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
            <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('settingsSections.localization.currency')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ru' ? 'Валюта для отображения цен' : 'Currency for displaying prices'}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currencies.map((curr) => {
              const isSelected = currency === curr.code;
              return (
                <button
                  key={curr.code}
                  onClick={() => setCurrency(curr.code)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-lg ring-2 ring-amber-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Галочка выбора */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    {/* Символ валюты */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${
                      isSelected 
                        ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {curr.symbol}
                    </div>
                    
                    {/* Информация */}
                    <div className="text-left min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {curr.code}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {language === 'ru' ? curr.name : curr.nameEn}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{language === 'ru' ? 'Пример:' : 'Example:'}</span>{' '}
              <span className="font-mono font-semibold">{formatCurrency(exampleAmount)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Первый день недели */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('settingsSections.localization.firstDayOfWeek')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ru' ? 'С какого дня начинается неделя' : 'Which day the week starts with'}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Понедельник */}
            {(() => {
              const isSelected = firstDayOfWeek === 'monday';
              return (
                <button
                  onClick={() => setFirstDayOfWeek('monday')}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md bg-white dark:bg-gray-800'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {language === 'ru' ? 'Понедельник' : 'Monday'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ru' ? 'Россия, Европа' : 'Russia, Europe'}
                    </div>
                  </div>

                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {(language === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((day, i) => (
                      <div
                        key={day}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg flex-shrink-0 ${
                          i === 0
                            ? 'bg-purple-600 text-white'
                            : i >= 5
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })()}

            {/* Воскресенье */}
            {(() => {
              const isSelected = firstDayOfWeek === 'sunday';
              return (
                <button
                  onClick={() => setFirstDayOfWeek('sunday')}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg ring-2 ring-purple-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md bg-white dark:bg-gray-800'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {language === 'ru' ? 'Воскресенье' : 'Sunday'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ru' ? 'США, Канада, Израиль' : 'USA, Canada, Israel'}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {(language === 'ru' ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']).map((day, i) => (
                      <div
                        key={day}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg flex-shrink-0 ${
                          i === 0
                            ? 'bg-purple-600 text-white'
                            : i === 6
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })()}
          </div>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {language === 'ru' ? 'Текущий порядок:' : 'Current order:'}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {getWeekDays().map((day, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    i === 0
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{language === 'ru' ? 'Изменения сохраняются автоматически' : 'Changes are saved automatically'}</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            {language === 'ru' ? 'Сбросить' : 'Reset'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Save className="w-4 h-4" />
            {language === 'ru' ? 'Сохранить' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент карточки интеграции
const IntegrationCard: React.FC<{
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  statusText: string;
}> = ({ name, description, icon, status, statusText }) => {
  const statusColors = {
    connected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    disconnected: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
            <Tooltip content={`Статус: ${statusText}`} position="top">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                {statusText}
              </span>
            </Tooltip>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {status === 'connected' ? 'Настроить' : 'Подключить'}
            </button>
            {status === 'connected' && (
              <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                Отключить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент карточки роли
const RoleCard: React.FC<{
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  color: string;
}> = ({ name, description, permissions, usersCount, color }) => {
  const [expanded, setExpanded] = useState(false);
  const visiblePermissions = expanded ? permissions : permissions.slice(0, 3);
  const hasMore = permissions.length > 3;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <Tooltip content={`${usersCount} пользователей с этой ролью`} position="left">
          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
            {usersCount} польз.
          </span>
        </Tooltip>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {visiblePermissions.map((perm, i) => (
          <Tooltip key={i} content={`Разрешение: ${perm}`} position="top" delay={500}>
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
              {perm}
            </span>
          </Tooltip>
        ))}
        {hasMore && !expanded && (
          <button 
            onClick={() => setExpanded(true)}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            +{permissions.length - 3} ещё
          </button>
        )}
        {expanded && hasMore && (
          <button 
            onClick={() => setExpanded(false)}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Свернуть
          </button>
        )}
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Tooltip content="Редактировать права роли" position="top">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
            <span>Изменить</span>
          </button>
        </Tooltip>
        <Tooltip content="Посмотреть пользователей с этой ролью" position="top">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Users className="w-4 h-4" />
            <span>Пользователи</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

// Компонент API ключа
const ApiKeyRow: React.FC<{
  name: string;
  keyValue: string;
  created: string;
  lastUsed: string;
}> = ({ name, keyValue, created, lastUsed }) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(keyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = keyValue.slice(0, 8) + '•'.repeat(24) + keyValue.slice(-4);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content={showKey ? 'Скрыть ключ' : 'Показать ключ'} position="top">
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Tooltip>
          <Tooltip content={copied ? 'Скопировано!' : 'Копировать ключ'} position="top">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </Tooltip>
          <Tooltip content="Удалить ключ" position="top">
            <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="font-mono text-sm bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-600 break-all">
        {showKey ? keyValue : maskedKey}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <Tooltip content="Дата создания ключа" position="top">
          <span>Создан: {created}</span>
        </Tooltip>
        <Tooltip content="Последнее использование" position="top">
          <span>Использован: {lastUsed}</span>
        </Tooltip>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { t } = useLocalization();
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
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
    emailFrom: 'noreply@marketplace.ru'
  });

  const activeConfig = settingsSections.find(s => s.id === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settingsSections.general.siteName')}
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settingsSections.general.domain')}
                </label>
                <input
                  type="text"
                  value={settings.domain}
                  onChange={(e) => setSettings({...settings, domain: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settingsSections.general.timezone')}
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Europe/Moscow">{t('timezones.moscow')}</option>
                  <option value="Europe/Kaliningrad">{t('timezones.kaliningrad')}</option>
                  <option value="Asia/Yekaterinburg">{t('timezones.yekaterinburg')}</option>
                  <option value="Asia/Vladivostok">{t('timezones.vladivostok')}</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('settingsSections.general.workModes')}
              </h3>
              <div className="space-y-3">
                <Toggle
                  enabled={settings.maintenanceMode}
                  onChange={(v) => setSettings({...settings, maintenanceMode: v})}
                  label={t('settingsSections.general.maintenanceMode')}
                  description={t('settingsSections.general.maintenanceModeDesc')}
                />
                <Toggle
                  enabled={settings.debugMode}
                  onChange={(v) => setSettings({...settings, debugMode: v})}
                  label={t('settingsSections.general.debugMode')}
                  description={t('settingsSections.general.debugModeDesc')}
                />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-300">{t('settingsSections.security.securityRecommendations')}</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    {t('settingsSections.security.securityRecommendationsDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Toggle
                enabled={settings.twoFactorAuth}
                onChange={(v) => setSettings({...settings, twoFactorAuth: v})}
                label={t('settingsSections.security.twoFactorAuth')}
                description={t('settingsSections.security.twoFactorAuthDesc')}
              />
              <Toggle
                enabled={settings.autoLogout}
                onChange={(v) => setSettings({...settings, autoLogout: v})}
                label={t('settingsSections.security.autoLogout')}
                description={t('settingsSections.security.autoLogoutDesc')}
              />
              <Toggle
                enabled={settings.loginNotifications}
                onChange={(v) => setSettings({...settings, loginNotifications: v})}
                label={t('settingsSections.security.loginNotifications')}
                description={t('settingsSections.security.loginNotificationsDesc')}
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settingsSections.security.passwordParams')}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settingsSections.security.passwordMinLength')}
                  </label>
                  <input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                    min={6}
                    max={32}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settingsSections.security.maxLoginAttempts')}
                  </label>
                  <input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                    min={3}
                    max={10}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-3">
            <Toggle
              enabled={settings.notifyOrders}
              onChange={(v) => setSettings({...settings, notifyOrders: v})}
              label={t('settingsSections.notifications.newOrders')}
              description={t('settingsSections.notifications.newOrdersDesc')}
            />
            <Toggle
              enabled={settings.notifyErrors}
              onChange={(v) => setSettings({...settings, notifyErrors: v})}
              label={t('settingsSections.notifications.systemErrors')}
              description={t('settingsSections.notifications.systemErrorsDesc')}
            />
            <Toggle
              enabled={settings.notifyReports}
              onChange={(v) => setSettings({...settings, notifyReports: v})}
              label={t('settingsSections.notifications.weeklyReports')}
              description={t('settingsSections.notifications.weeklyReportsDesc')}
            />
            <Toggle
              enabled={settings.notifyUpdates}
              onChange={(v) => setSettings({...settings, notifyUpdates: v})}
              label={t('settingsSections.notifications.systemUpdates')}
              description={t('settingsSections.notifications.systemUpdatesDesc')}
            />
            <Toggle
              enabled={settings.notifyReminders}
              onChange={(v) => setSettings({...settings, notifyReminders: v})}
              label={t('settingsSections.notifications.reminders')}
              description={t('settingsSections.notifications.remindersDesc')}
            />
          </div>
        );

      case 'integrations':
        return (
          <div className="grid gap-4">
            <IntegrationCard
              name="Apache Superset"
              description={t('dashboards.description')}
              icon={<Database className="w-6 h-6 text-blue-600" />}
              status="connected"
              statusText={t('settingsSections.integrations.connected')}
            />
            <IntegrationCard
              name="Telegram Bot"
              description="Уведомления и команды через Telegram"
              icon={<MessageSquare className="w-6 h-6 text-blue-500" />}
              status="connected"
              statusText={t('settingsSections.integrations.connected')}
            />
            <IntegrationCard
              name="1C:Enterprise"
              description="Синхронизация товаров и заказов"
              icon={<Server className="w-6 h-6 text-yellow-600" />}
              status="error"
              statusText="Ошибка синхронизации"
            />
            <IntegrationCard
              name="CDEK"
              description="Расчёт и отслеживание доставки"
              icon={<Truck className="w-6 h-6 text-green-600" />}
              status="connected"
              statusText={t('settingsSections.integrations.connected')}
            />
            <IntegrationCard
              name="YuKassa"
              description="Приём онлайн-платежей"
              icon={<CreditCard className="w-6 h-6 text-purple-600" />}
              status="disconnected"
              statusText="Не подключено"
            />
          </div>
        );

      case 'localization':
        return <LocalizationSection />;

      case 'email':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settingsSections.email.smtpServer')}
                  </label>
                  <input
                    type="text"
                    value={settings.smtpServer}
                    onChange={(e) => setSettings({...settings, smtpServer: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settingsSections.email.smtpPort')}
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settingsSections.email.encryption')}
                </label>
                <select
                  value={settings.smtpEncryption}
                  onChange={(e) => setSettings({...settings, smtpEncryption: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="none">{t('encryption.none')}</option>
                  <option value="ssl">{t('encryption.ssl')}</option>
                  <option value="tls">{t('encryption.tls')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settingsSections.email.emailFrom')}
                </label>
                <input
                  type="email"
                  value={settings.emailFrom}
                  onChange={(e) => setSettings({...settings, emailFrom: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Tooltip content={t('settingsSections.email.testEmail')} position="right">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Mail className="w-4 h-4" />
                  {t('settingsSections.email.testEmail')}
                </button>
              </Tooltip>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settingsSections.api.apiKey')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settingsSections.api.permissions')}</p>
              </div>
              <Tooltip content={t('settingsSections.api.createNewKey')} position="left">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  {t('settingsSections.api.create')}
                </button>
              </Tooltip>
            </div>

            <div className="space-y-4">
              <ApiKeyRow
                name="Production API Key"
                keyValue="mk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
                created="15.01.2024"
                lastUsed={t('settingsSections.api.today')}
              />
              <ApiKeyRow
                name="Development API Key"
                keyValue="mk_dev_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4"
                created="10.12.2023"
                lastUsed="Вчера, 09:15"
              />
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-300">{t('common.warning')}</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    {t('settingsSections.api.keyWarning')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.roles')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.rolesDesc')}</p>
              </div>
              <Tooltip content={t('settingsSections.roles.editRole')} position="left">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  {t('settingsSections.roles.editRole')}
                </button>
              </Tooltip>
            </div>

            <div className="grid gap-4">
              <RoleCard
                name={t('settingsSections.roles.admin')}
                description={t('settingsSections.roles.adminDesc')}
                permissions={[t('permissions.edit_users'), t('settings.general'), t('permissions.view_financials'), t('permissions.edit_products'), t('permissions.export_data'), t('settings.roles'), t('settings.api')]}
                usersCount={3}
                color="bg-red-500"
              />
              <RoleCard
                name={t('settingsSections.roles.analyst')}
                description={t('settingsSections.roles.analystDesc')}
                permissions={[t('permissions.view_analytics'), t('permissions.create_reports'), t('permissions.export_data'), t('permissions.view_financials'), t('permissions.view_dashboards')]}
                usersCount={5}
                color="bg-blue-500"
              />
              <RoleCard
                name={t('settingsSections.roles.manager')}
                description={t('settingsSections.roles.managerDesc')}
                permissions={[t('permissions.edit_products'), t('permissions.edit_orders'), 'Управление акциями', 'Просмотр клиентов']}
                usersCount={12}
                color="bg-green-500"
              />
              <RoleCard
                name={t('settingsSections.roles.viewer')}
                description={t('settingsSections.roles.viewerDesc')}
                permissions={[t('permissions.view_dashboard'), t('permissions.view_products')]}
                usersCount={8}
                color="bg-gray-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settings.generalDesc')}</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - сделаем шире и адаптивнее */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1 sticky top-6">
            {settingsSections.map((section) => (
              <MenuButton
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
                t={t}
              />
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                {activeConfig?.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {activeConfig?.label}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeConfig?.description}
                </p>
              </div>
            </div>

            {renderSection()}

            {/* Save button */}
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Tooltip content="Сбросить изменения" position="top">
                <button className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Сбросить
                </button>
              </Tooltip>
              <Tooltip content="Сохранить все изменения" position="top">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  <Save className="w-4 h-4" />
                  Сохранить изменения
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
