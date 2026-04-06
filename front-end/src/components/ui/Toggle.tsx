import React from 'react';
import { cn } from '../../utils/cn';

export interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-all',
        disabled
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600',
        className
      )}
    >
      <div className="flex-1 min-w-0 mr-4">
        {label && (
          <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        )}
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
        )}
      </div>

      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={cn(
          'relative flex-shrink-0 w-12 h-6 rounded-full transition-colors',
          enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
};
