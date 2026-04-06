import { useState } from 'react';
import {
  X,
  HelpCircle,
  Book,
  MessageCircle,
  Video,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Search,
  Keyboard,
  Zap,
  Users,
  BarChart3,
  Settings,
  Shield,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'overview' | 'guides' | 'faq' | 'shortcuts' | 'support';

const tabs: { id: Tab; label: string; icon: typeof HelpCircle }[] = [
  { id: 'overview', label: 'Обзор', icon: HelpCircle },
  { id: 'guides', label: 'Руководства', icon: Book },
  { id: 'faq', label: 'FAQ', icon: MessageCircle },
  { id: 'shortcuts', label: 'Горячие клавиши', icon: Keyboard },
  { id: 'support', label: 'Поддержка', icon: Mail },
];

const guides = [
  {
    title: 'Начало работы',
    description: 'Базовое руководство по работе с системой',
    icon: Zap,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    articles: ['Первый вход', 'Настройка профиля', 'Обзор интерфейса'],
  },
  {
    title: 'Управление пользователями',
    description: 'Роли, права доступа и приглашения',
    icon: Users,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    articles: ['Создание пользователей', 'Настройка ролей', 'Управление доступом'],
  },
  {
    title: 'Аналитика и отчёты',
    description: 'Работа с дашбордами и экспорт данных',
    icon: BarChart3,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    articles: ['Обзор метрик', 'Создание отчётов', 'Экспорт в Excel/PDF'],
  },
  {
    title: 'Настройки системы',
    description: 'Конфигурация и интеграции',
    icon: Settings,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    articles: ['Общие настройки', 'API интеграции', 'Webhooks'],
  },
  {
    title: 'Безопасность',
    description: 'Защита аккаунта и данных',
    icon: Shield,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    articles: ['Двухфакторная аутентификация', 'Журнал активности', 'Политика паролей'],
  },
];

const faqItems = [
  {
    question: 'Как сбросить пароль?',
    answer: 'Перейдите на страницу входа и нажмите "Забыли пароль?". На вашу почту придёт ссылка для сброса пароля. Ссылка действительна 24 часа.',
  },
  {
    question: 'Как добавить нового пользователя?',
    answer: 'Перейдите в раздел "Пользователи", нажмите "Добавить пользователя", заполните форму и выберите роль. Пользователь получит приглашение на email.',
  },
  {
    question: 'Как экспортировать отчёт?',
    answer: 'В любом разделе аналитики нажмите кнопку "Экспорт" в правом верхнем углу. Выберите формат (PDF, Excel, CSV) и период данных.',
  },
  {
    question: 'Почему не приходят уведомления?',
    answer: 'Проверьте настройки уведомлений в профиле. Убедитесь, что email уведомления включены и ваш email подтверждён. Также проверьте папку "Спам".',
  },
  {
    question: 'Как настроить двухфакторную аутентификацию?',
    answer: 'Перейдите в Настройки → Безопасность → Двухфакторная аутентификация. Отсканируйте QR-код в приложении Google Authenticator или Authy.',
  },
  {
    question: 'Как изменить язык интерфейса?',
    answer: 'Откройте меню профиля, перейдите в "Настройки" → "Язык" и выберите нужный язык из списка. Изменения применятся сразу.',
  },
  {
    question: 'Что означают статусы заказов?',
    answer: '"Ожидает" - заказ принят, "В работе" - заказ обрабатывается, "Выполнен" - заказ завершён, "Отменён" - заказ отменён.',
  },
  {
    question: 'Как связаться с техподдержкой?',
    answer: 'Вы можете написать на support@company.ru, позвонить по телефону +7 (800) 123-45-67 или создать тикет в разделе "Поддержка".',
  },
];

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Открыть поиск' },
  { keys: ['⌘', '/'], description: 'Открыть справку' },
  { keys: ['⌘', 'B'], description: 'Свернуть/развернуть боковую панель' },
  { keys: ['⌘', '1-7'], description: 'Быстрый переход к разделам' },
  { keys: ['Esc'], description: 'Закрыть модальное окно' },
  { keys: ['↑', '↓'], description: 'Навигация в списках' },
  { keys: ['Enter'], description: 'Выбор элемента' },
  { keys: ['⌘', 'S'], description: 'Сохранить изменения' },
  { keys: ['⌘', 'Shift', 'E'], description: 'Экспорт данных' },
  { keys: ['⌘', 'Shift', 'N'], description: 'Создать новый элемент' },
];

const supportTickets = [
  {
    id: '#T-2024-001',
    subject: 'Проблема с экспортом PDF',
    status: 'resolved',
    date: '2 дня назад',
  },
  {
    id: '#T-2024-002',
    subject: 'Вопрос по API интеграции',
    status: 'pending',
    date: '5 часов назад',
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', priority: 'normal' });

  if (!isOpen) return null;

  const filteredFaq = faqItems.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Справка и поддержка
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Найдите ответы на вопросы или свяжитесь с нами
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-52 border-r border-gray-200 dark:border-gray-700 corporate:border-slate-600 p-3 flex-shrink-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  activeTab === id
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Добро пожаловать в справочный центр!</h3>
                  <p className="opacity-90 mb-4">
                    Здесь вы найдёте руководства, ответы на часто задаваемые вопросы и сможете
                    связаться с нашей командой поддержки.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('guides')}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Book className="w-4 h-4" />
                      Руководства
                    </button>
                    <button
                      onClick={() => setActiveTab('support')}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Поддержка
                    </button>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Быстрые ссылки
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Book, label: 'Документация', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
                      { icon: Video, label: 'Видеоуроки', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
                      { icon: FileText, label: 'Changelog', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                      { icon: MessageCircle, label: 'Сообщество', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className={`p-2 rounded-lg ${item.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Email</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@company.ru</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ответ в течение 24 часов</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Телефон</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+7 (800) 123-45-67</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Пн-Пт, 9:00 - 18:00</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'guides' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Руководства пользователя
                </h3>
                {guides.map((guide, index) => {
                  const Icon = guide.icon;
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${guide.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {guide.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {guide.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {guide.articles.map((article, i) => (
                              <button
                                key={i}
                                className="px-3 py-1 text-sm bg-white dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                              >
                                {article}
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Поиск по вопросам..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  {filteredFaq.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <span className="font-medium text-gray-900 dark:text-white pr-4">
                          {item.question}
                        </span>
                        <ChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                            expandedFaq === index ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {expandedFaq === index && (
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Горячие клавиши
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Используйте клавиатуру для быстрой навигации по системе
                </p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div className="space-y-3">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-0"
                      >
                        <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i}>
                              <kbd className="px-2 py-1 text-sm font-medium bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-500 shadow-sm">
                                {key}
                              </kbd>
                              {i < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                {/* Create Ticket */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Создать обращение
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Тема
                      </label>
                      <input
                        type="text"
                        value={ticketForm.subject}
                        onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="Кратко опишите проблему"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Приоритет
                      </label>
                      <select
                        value={ticketForm.priority}
                        onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="low">Низкий</option>
                        <option value="normal">Обычный</option>
                        <option value="high">Высокий</option>
                        <option value="critical">Критический</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Сообщение
                      </label>
                      <textarea
                        value={ticketForm.message}
                        onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })}
                        rows={4}
                        placeholder="Опишите вашу проблему подробнее..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                    <button className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Mail className="w-5 h-5" />
                      Отправить обращение
                    </button>
                  </div>
                </div>

                {/* Recent Tickets */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ваши обращения
                  </h3>
                  <div className="space-y-2">
                    {supportTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          {ticket.status === 'resolved' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ticket.subject}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {ticket.id} • {ticket.date}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            ticket.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {ticket.status === 'resolved' ? 'Решён' : 'В работе'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
