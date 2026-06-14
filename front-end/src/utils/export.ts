/**
 * Экспорт данных в CSV-файл (совместим с Excel).
 */

export interface Column<T> {
  header: string;
  accessor: (item: T) => string | number | null;
}

export function exportToCSV<T>(
  data: T[],
  columns: Column<T>[],
  filename: string,
): void {
  if (!data.length) return;

  // BOM для корректного открытия кириллицы в Excel
  const BOM = '\uFEFF';
  const separator = ';';

  const headers = columns.map(c => `"${c.header}"`).join(separator);

  const rows = data.map(item =>
    columns
      .map(c => {
        const val = c.accessor(item);
        const str = val === null || val === undefined ? '' : String(val);
        // Экранируем кавычки
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(separator),
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
