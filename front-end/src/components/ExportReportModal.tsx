import React, { useState } from 'react';
import {
  X, FileText, Mail, Loader2, Check, AlertCircle, Download, Send,
} from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContext';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardTitle?: string;
}

type ExportOption = 'pdf' | 'email' | null;

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  dashboardTitle,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<ExportOption>(null);
  const [email, setEmail] = useState(user?.email || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = async (option: ExportOption) => {
    if (!option) return;
    setSelectedOption(option);
    setIsProcessing(true);
    setResult(null);

    try {
      if (option === 'pdf') {
        // Скачиваем PDF напрямую с backend (валидный PDF из LaTeX)
        const title = encodeURIComponent(dashboardTitle || 'Dashboard');
        const url = `/email-api/download-pdf?dashboard=${title}`;
        downloadFromUrl(url, `report-${dashboardTitle || 'dashboard'}_${formatDateFile()}.pdf`);
        setResult({ type: 'success', message: 'PDF сохранён' });
      } else if (option === 'email') {
        if (!email) {
          setResult({ type: 'error', message: 'Укажите email' });
          setIsProcessing(false);
          return;
        }
        if (!isValidEmail(email)) {
          setResult({ type: 'error', message: 'Некорректный email' });
          setIsProcessing(false);
          return;
        }

        await simulateExport(t('dashboards.exportModal.sending'));

        const response = await fetch('/email-api/export-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'pdf',
            email,
            dashboardTitle: dashboardTitle || 'Dashboard',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg = errorData?.error || t('dashboards.exportModal.sendingError');
          setResult({ type: 'error', message: errorMsg });
        } else {
          const responseData = await response.json();
          const chartsInfo = responseData.charts_count
            ? ` (${responseData.charts_count} графиков)`
            : '';
          const sizeInfo = responseData.pdf_size_bytes
            ? ` [${(responseData.pdf_size_bytes / 1024).toFixed(0)} КБ]`
            : '';
          setResult({
            type: 'success',
            message: `${t('dashboards.exportModal.sendingSuccess').replace('{email}', email)}${chartsInfo}${sizeInfo}`,
          });
        }
      }
    } catch {
      setResult({ type: 'error', message: t('dashboards.exportModal.sendingError') });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setResult(null);
    setEmail(user?.email || '');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboards.exportModal.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('dashboards.exportModal.subtitle')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!selectedOption && !result && (
            <div className="space-y-3">
              {/* PDF Option */}
              <ExportOptionButton
                icon={<FileText className="w-6 h-6" />}
                title={t('dashboards.exportModal.downloadPdf')}
                description={t('dashboards.exportModal.downloadPdfDesc')}
                color="red"
                onClick={() => handleExport('pdf')}
              />

              {/* Email Option */}
              <ExportOptionButton
                icon={<Mail className="w-6 h-6" />}
                title={t('dashboards.exportModal.sendEmail')}
                description={t('dashboards.exportModal.sendEmailDesc')}
                color="green"
                onClick={() => handleExport('email')}
              />
            </div>
          )}

          {/* Email Input (when email option selected) */}
          {selectedOption === 'email' && !isProcessing && !result && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('dashboards.exportModal.emailPlaceholder')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('dashboards.exportModal.emailPlaceholder')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {user?.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    {t('dashboards.exportModal.emailFromSuperset')}: {user.email}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={() => handleExport('email')}
                  disabled={!email}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Отправить
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedOption === 'pdf' && t('dashboards.exportModal.preparingPdf')}
                {selectedOption === 'png' && t('dashboards.exportModal.preparingPng')}
                {selectedOption === 'email' && t('dashboards.exportModal.sending')}
              </p>
            </div>
          )}

          {/* Result State */}
          {result && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  result.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.type === 'success' ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        result.type === 'success'
                          ? 'text-green-800 dark:text-green-300'
                          : 'text-red-800 dark:text-red-300'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────

interface ExportOptionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'red' | 'blue' | 'green';
  onClick: () => void;
}

const ExportOptionButton: React.FC<ExportOptionButtonProps> = ({
  icon,
  title,
  description,
  color,
  onClick,
}) => {
  const colorMap = {
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      hover: 'hover:border-red-300 dark:hover:border-red-600',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:border-blue-300 dark:hover:border-blue-600',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      hover: 'hover:border-green-300 dark:hover:border-green-600',
    },
  };

  const c = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all ${c.hover} hover:shadow-md text-left`}
    >
      <div className={`p-3 rounded-xl ${c.bg} ${c.text}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white">{title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
      </div>
      <Download className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </button>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────

function simulateExport(_statusMessage: string, ms = 15000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDateFile(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

/** Скачивает файл с сервера (скрытый <a> click). */
function downloadFromUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
