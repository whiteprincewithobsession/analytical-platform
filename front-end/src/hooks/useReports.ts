import { useState, useMemo } from 'react';
import type { Report } from '../types';

interface UseReportsOptions {
  reports: Report[];
  initialType?: string;
}

export function useReports({ reports, initialType = 'Все' }: UseReportsOptions) {
  const [selectedType, setSelectedType] = useState(initialType);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredReports = useMemo(() => {
    if (selectedType === 'Все') {
      return reports;
    }
    return reports.filter(report => report.type === selectedType);
  }, [reports, selectedType]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      completed: reports.filter(r => r.status === 'completed').length,
      processing: reports.filter(r => r.status === 'processing').length,
      failed: reports.filter(r => r.status === 'failed').length,
    };
  }, [reports]);

  const setReportType = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

  const createReport = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  return {
    filteredReports,
    selectedType,
    showCreateModal,
    stats,
    setReportType,
    createReport,
    closeCreateModal,
  };
}
