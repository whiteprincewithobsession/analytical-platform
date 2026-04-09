import React from 'react';
import { cn } from '../../utils/cn';


export interface TableProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Table: React.FC<TableProps> = ({ children, className, hoverable = true }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full', className)}>
        {children}
      </table>
    </div>
  );
};


export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-gray-50 dark:bg-gray-700/50', className)}>
      {children}
    </thead>
  );
};


export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-700', className)}>
      {children}
    </tbody>
  );
};


export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className, onClick, hoverable = true }) => {
  return (
    <tr
      className={cn(
        'transition-colors',
        hoverable && onClick && 'hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};


export interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className,
  align = 'left',
  width,
}) => {
  return (
    <th
      className={cn(
        'px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        width && `w-[${width}]`,
        className
      )}
    >
      {children}
    </th>
  );
};


export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className,
  align = 'left',
  verticalAlign = 'middle',
}) => {
  return (
    <td
      className={cn(
        'px-6 py-4 text-sm',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        verticalAlign === 'top' && 'align-top',
        verticalAlign === 'middle' && 'align-middle',
        verticalAlign === 'bottom' && 'align-bottom',
        className
      )}
    >
      {children}
    </td>
  );
};


export interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const TableFooter: React.FC<TableFooterProps> = ({ children, className }) => {
  return (
    <tfoot className={cn('bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700', className)}>
      {children}
    </tfoot>
  );
};
