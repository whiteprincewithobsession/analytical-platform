import React from 'react';
import { cn } from '../../utils/cn';

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  tabs: { id: string; label: string; labelEn?: string; icon?: React.ReactNode; disabled?: boolean }[];
  className?: string;
  language?: 'ru' | 'en';
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onChange,
  tabs,
  className,
  language = 'ru',
}) => {
  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700', className)}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isSelected = value === tab.id;
          const label = language === 'en' && tab.labelEn ? tab.labelEn : tab.label;
          
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
                isSelected
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export interface TabPanelProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ value, activeValue, children, className }) => {
  if (value !== activeValue) return null;
  
  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  );
};
