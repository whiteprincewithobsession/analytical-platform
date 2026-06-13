import { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronLeft,
  Search,
  Keyboard,
  Zap,
  Users,
  BarChart3,
  Settings,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Key,
  Eye,
  Activity,
  Download,
  Globe,
  Webhook,
  UserPlus,
  UserCheck,
  Lock,
  ListChecks,
  Plus,
  Filter,
  PieChart,
  TrendingUp,
  CreditCard,
  Bell,
  Globe2,
  RotateCcw,
  Check,
  GitCommit,
  Calendar,
  Tag,
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

// Полное содержание всех 15 статей
const guideArticles: Record<string, { title: string; sections: { heading: string; content: string; steps?: string[]; tips?: string[]; icon?: typeof Zap }[] }> = {
  // ===== НАЧАЛО РАБОТЫ =====
  'Первый вход': {
    title: 'Первый вход в систему',
    sections: [
      {
        heading: 'Как войти в систему',
        content: 'Для входа в платформу Omni Retail Core используйте учётные данные, предоставленные администратором. Перейдите по ссылке платформы и введите логин и пароль на странице авторизации.',
        steps: [
          'Откройте браузер и перейдите по адресу платформы (по умолчанию: http://localhost:3000)',
          'На экране входа введите ваш email и пароль',
          'Нажмите кнопку «Войти»',
          'При первом входе система может предложить сменить пароль — следуйте инструкциям',
        ],
        tips: [
          'Если вы забыли пароль, нажмите «Забыли пароль?» — ссылка для сброса придёт на email',
          'При проблемах со входом обратитесь к администратору системы',
        ],
      },
      {
        heading: 'После первого входа',
        content: 'После успешной авторизации вы попадёте на главную страницу (Обзор). Здесь вы увидите основные метрики и дашборды, доступные вашей роли.',
        steps: [
          'Проверьте, что ваш профиль отображается корректно (имя и роль в правом верхнем углу)',
          'Ознакомьтесь с боковой панелью — она содержит основные разделы системы',
          'Используйте глобальный поиск (Ctrl+K) для быстрого перехода к нужным разделам',
        ],
      },
    ],
  },
  'Настройка профиля': {
    title: 'Настройка профиля пользователя',
    sections: [
      {
        heading: 'Редактирование профиля',
        content: 'Ваш профиль содержит личную информацию, настройки уведомлений и параметры безопасности. Для редактирования перейдите в меню профиля (аватар в правом верхнем углу) → «Настройки».',
        steps: [
          'Нажмите на аватар в правом верхнем углу',
          'Выберите «Настройки» из выпадающего меню',
          'Во вкладке «Профиль» вы можете изменить: имя, email, фотографию, часовой пояс',
          'Нажмите «Сохранить» для применения изменений',
        ],
      },
      {
        heading: 'Настройки уведомлений',
        content: 'Управляйте тем, какие уведомления вы получаете и через какие каналы.',
        steps: [
          'Перейдите в Настройки → Уведомления',
          'Включите/отключите push-уведомления, email-уведомления и SMS',
          'Настройте частоту дайджестов: мгновенно, ежедневно, еженедельно',
          'Выберите категории событий: заказы, пользователи, системные события',
        ],
        tips: [
          'Рекомендуем оставить email-уведомления для критических событий',
          'Слишком частые уведомления можно отключить в пользу еженедельного дайджеста',
        ],
      },
      {
        heading: 'Персонализация интерфейса',
        content: 'Настройте внешний вид под себя: тему, язык, формат дат и валюту.',
        steps: [
          'Перейдите в Настройки → Внешний вид',
          'Выберите тему: светлая, тёмная, корпоративная или системная',
          'Выберите язык интерфейса: русский или английский',
          'Настройте формат даты и валюту для отображения финансовых данных',
        ],
      },
    ],
  },
  'Обзор интерфейса': {
    title: 'Обзор интерфейса платформы',
    sections: [
      {
        heading: 'Структура платформы',
        content: 'Omni Retail Core состоит из нескольких основных разделов, доступных через боковую панель:',
        steps: [
          'Обзор — главная панель с ключевыми метриками и дашбордами',
          'Дашборды — коллекция визуализаций и отчётов (Superset)',
          'Продажи — аналитика продаж, тренды, воронки',
          'Товары — каталог, управление ассортиментом, остатки',
          'Аналитика — углублённый анализ данных с фильтрами',
          'Отчёты — создание и управление отчётами',
          'Пользователи — управление пользователями и ролями (только администратор)',
          'Настройки — конфигурация системы и интеграций',
        ],
      },
      {
        heading: 'Боковая панель',
        content: 'Боковая панель слева содержит навигацию по разделам. Её можно свернуть до иконок, нажав кнопку вверху панели. Разделы, недоступные вашей роли, отображаются с иконкой замка 🔒.',
        tips: [
          'Горячая клавиша Ctrl+B сворачивает/разворачивает боковую панель',
          'Цифры 1-8 (с Ctrl+Shift) — быстрый переход к разделам',
        ],
      },
      {
        heading: 'Глобальный поиск',
        content: 'Нажмите Ctrl+K для открытия глобального поиска. Он ищет по страницам, пользователям, заказам, товарам и настройкам. Поддерживается нечёткий поиск (fuzzy match) и командный режим (начните ввод с >).',
        steps: [
          'Нажмите Ctrl+K — откроется окно поиска',
          'Начните вводить запрос — результаты появятся мгновенно',
          'Используйте фильтры (все/страницы/пользователи/товары) для сужения',
          'В командном режиме (>) доступны быстрые команды: смена темы, языка, выход',
        ],
      },
      {
        heading: 'Верхняя панель (Header)',
        content: 'В шапке расположены: глобальный поиск, переключатель темы, панель уведомлений и меню профиля.',
      },
    ],
  },

  // ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =====
  'Создание пользователей': {
    title: 'Создание и управление пользователями',
    sections: [
      {
        heading: 'Создание нового пользователя',
        content: 'Только администраторы могут создавать новых пользователей. Для этого перейдите в раздел «Пользователи» и нажмите «Добавить пользователя».',
        steps: [
          'Перейдите в раздел «Пользователи» (требуется роль admin)',
          'Нажмите кнопку «Добавить пользователя» в правом верхнем углу',
          'Заполните форму: имя, email, роль, отдел',
          'Пользователь получит приглашение на указанный email',
          'До подтверждения email статус пользователя будет «Ожидает»',
        ],
        tips: [
          'Email должен быть уникальным — система не позволит создать дубликат',
          'Новый пользователь должен подтвердить email в течение 48 часов',
        ],
      },
      {
        heading: 'Редактирование пользователя',
        content: 'Для изменения данных пользователя нажмите на его карточку и выберите «Редактировать».',
        steps: [
          'Откройте карточку пользователя',
          'Нажмите иконку «Редактировать» (карандаш)',
          'Измените нужные поля: имя, email, отдел',
          'Нажмите «Сохранить»',
        ],
      },
      {
        heading: 'Удаление пользователя',
        content: 'Удаление пользователя — необратимая операция. Все связанные данные (корзины, заказы) сохраняются, но привязка к пользователю удаляется.',
        tips: [
          'Вместо удаления рекомендуется деактивировать пользователя',
          'Деактивированный пользователь не может войти в систему, но его данные сохраняются',
        ],
      },
    ],
  },
  'Настройка ролей': {
    title: 'Настройка ролей и прав доступа',
    sections: [
      {
        heading: 'Система ролей',
        content: 'В Omni Retail Core используется RBAC (Role-Based Access Control) с 4 ролями:',
        steps: [
          'admin — полный доступ ко всем 22 разрешениям: управление пользователями, настройками, финансами, системой',
          'analyst — доступ к аналитике, отчётам, финансовым данным и экспорту',
          'manager — управление товарами, заказами и промо-акциями',
          'spectator — только просмотр: дашборды, продажи, товары',
        ],
      },
      {
        heading: 'Изменение роли пользователя',
        content: 'Администратор может изменить роль любого пользователя:',
        steps: [
          'Перейдите в раздел «Пользователи»',
          'Откройте карточку нужного пользователя',
          'Нажмите «Изменить роль»',
          'Выберите новую роль из списка',
          'Подтвердите изменение — права обновятся мгновенно',
        ],
        tips: [
          'При смене роли пользователь получает уведомление на email',
          'Изменения вступают в силу немедленно — не нужно перезаходить в систему',
        ],
      },
      {
        heading: 'Матрица разрешений',
        content: 'Каждая роль имеет определённый набор из 22 возможных разрешений. Полный список: view_dashboard, view_dashboards, view_sales, view_products, view_analytics, view_reports, view_users, view_settings, edit_products, edit_orders, edit_users, edit_settings, export_data, create_reports, manage_promotions, invite_users, view_financials, view_system_alerts, manage_system.',
      },
    ],
  },
  'Управление доступом': {
    title: 'Управление доступом и правами',
    sections: [
      {
        heading: 'Принцип наименьших прав',
        content: 'Рекомендуется назначать пользователям минимально необходимые права. Например, аналитику не нужна роль admin — достаточно analyst.',
        steps: [
          'Определите, какие функции нужны пользователю для работы',
          'Выберите роль с минимальным набором прав, покрывающим эти функции',
          'Используйте матрицу разрешений (в Настройках → Роли) для проверки',
        ],
      },
      {
        heading: 'Ограничение доступа к данным',
        content: 'Помимо ролей, можно ограничивать доступ на уровне данных:',
        steps: [
          'Фильтрация по отделу — пользователь видит только данные своего отдела',
          'Фильтрация по региону — ограничение по географическому признаку',
          'Временной доступ — роль назначается на определённый период',
        ],
        tips: [
          'Настройка временного доступа доступна через API или напрямую администратором',
        ],
      },
      {
        heading: 'Аудит доступа',
        content: 'Все действия по изменению прав записываются в журнал аудита (схема system). Администратор может просмотреть историю изменений прав любого пользователя в разделе «Пользователи» → «Журнал».',
      },
    ],
  },

  // ===== АНАЛИТИКА И ОТЧЁТЫ =====
  'Обзор метрик': {
    title: 'Обзор метрик и дашбордов',
    sections: [
      {
        heading: 'Ключевые метрики платформы',
        content: 'На главной странице (Обзор) отображаются основные KPI маркетплейса:',
        steps: [
          'Выручка — общий объём продаж за период (сравнение с предыдущим периодом)',
          'Количество заказов — динамика заказов по дням/неделям/месяцам',
          'Средний чек — средняя сумма одного заказа',
          'Конверсия — отношение посещений к оформленным заказам',
          'Активные пользователи — MAU (месячно), DAU (дневно)',
          'Отток клиентов — процент пользователей, не совершивших повторную покупку',
        ],
      },
      {
        heading: 'Работа с дашбордами',
        content: 'Дашборды создаются в Apache Superset и встраиваются в платформу. Перейдите в раздел «Дашборды» для просмотра доступных визуализаций.',
        steps: [
          'Откройте раздел «Дашборды»',
          'Выберите нужный дашборд из выпадающего списка',
          'Используйте фильтры в верхней части дашборда для настройки отображения',
          'Период, регион, категория — основные фильтры',
          'Нажмите «Обновить» для применения фильтров',
        ],
        tips: [
          'Дашборды кэшируются — для получения свежих данных нажмите «Обновить»',
          'Некоторые дашборды доступны только определённым ролям',
        ],
      },
      {
        heading: 'Типы визуализаций',
        content: 'В платформе доступны следующие типы графиков: линейные графики (тренды), столбчатые диаграммы (сравнение), круговые диаграммы (доли), таблицы (детализация), карты (геоданные), воронки (конверсия), KPI-карточки (ключевые показатели).',
      },
    ],
  },
  'Создание отчётов': {
    title: 'Создание и управление отчётами',
    sections: [
      {
        heading: 'Создание нового отчёта',
        content: 'Отчёты позволяют экспортировать данные в удобном формате для дальнейшего анализа или отправки руководству.',
        steps: [
          'Перейдите в раздел «Отчёты»',
          'Нажмите «Создать отчёт»',
          'Выберите тип отчёта: продажи, товары, пользователи, финансы, маркетинг',
          'Укажите период: день, неделя, месяц, квартал, год, произвольный диапазон',
          'Настройте фильтры: категория, регион, статус заказа',
          'Выберите формат: PDF, Excel (XLSX), CSV',
          'Нажмите «Создать» — отчёт появится в списке со статусом «Обработка»',
        ],
      },
      {
        heading: 'Статусы отчётов',
        content: 'Каждый отчёт проходит через несколько статусов:',
        steps: [
          'Обработка (processing) — отчёт формируется, данные собираются',
          'Готов (completed) — отчёт готов к скачиванию, нажмите кнопку «Скачать»',
          'Ошибка (failed) — что-то пошло не так, попробуйте создать отчёт заново или обратитесь в поддержку',
        ],
        tips: [
          'Большие отчёты (год, все категории) могут формироваться до 5 минут',
          'Готовые отчёты хранятся 30 дней, затем автоматически удаляются',
        ],
      },
      {
        heading: 'Расписание отчётов',
        content: 'Можно настроить автоматическое создание отчётов по расписанию (еженедельно, ежемесячно). Готовый отчёт будет отправлен на email. Настройка доступна через API или в разделе «Отчёты» → «Расписание».',
      },
    ],
  },
  'Экспорт в Excel/PDF': {
    title: 'Экспорт данных в Excel и PDF',
    sections: [
      {
        heading: 'Экспорт из любого раздела',
        content: 'В большинстве разделов (Продажи, Аналитика, Товары) есть кнопка «Экспорт» в правом верхнем углу.',
        steps: [
          'Откройте нужный раздел (например, «Продажи»)',
          'Настройте фильтры (период, категория, статус)',
          'Нажмите кнопку «Экспорт»',
          'Выберите формат: PDF (для печати/отправки), Excel (для анализа), CSV (для импорта в другие системы)',
          'Файл автоматически скачается на ваш компьютер',
        ],
      },
      {
        heading: 'Форматы экспорта',
        content: 'Каждый формат имеет свои особенности:',
        steps: [
          'PDF — готовый для печати документ с графиками и таблицами. Подходит для отправки руководству. Содержит логотип компании и дату формирования',
          'Excel (XLSX) — данные в виде таблиц с возможностью дальнейшей обработки. Каждый график на отдельном листе. Подходит для глубокого анализа',
          'CSV — «сырые» данные в текстовом формате. Подходит для импорта в другие системы и базы данных',
        ],
        tips: [
          'Экспорт в PDF доступен для ролей analyst и admin',
          'Экспорт в CSV доступен для всех ролей с правом view_analytics',
          'Лимит экспорта: 100 000 строк на файл (для больших объёмов используйте API)',
        ],
      },
      {
        heading: 'Экспорт через API',
        content: 'Для автоматизации можно использовать REST API платформы. Эндпоинты: GET /api/reports/export?format=pdf&period=month, GET /api/sales/export?format=xlsx&date_from=...&date_to=....',
      },
    ],
  },

  // ===== НАСТРОЙКИ СИСТЕМЫ =====
  'Общие настройки': {
    title: 'Общие настройки системы',
    sections: [
      {
        heading: 'Раздел «Общие»',
        content: 'В общих настройках konfigurруются базовые параметры платформы. Доступно только для роли admin.',
        steps: [
          'Название компании — отображается в заголовке и отчётах',
          'Часовой пояс по умолчанию — используется для всех дат и времени',
          'Валюта по умолчанию — RUB, USD или EUR. Влияет на отображение финансовых данных',
          'Формат даты — DD.MM.YYYY, MM/DD/YYYY или YYYY-MM-DD',
          'Язык по умолчанию — русский или английский для новых пользователей',
        ],
      },
      {
        heading: 'Настройки электронной почты',
        content: 'Конфигурация SMTP-сервера для отправки уведомлений и отчётов:',
        steps: [
          'SMTP-сервер — адрес сервера (например, smtp.gmail.com)',
          'Порт — обычно 587 (TLS) или 465 (SSL)',
          'Логин и пароль — учётные данные SMTP-аккаунта',
          'Email отправителя — адрес, от имени которого отправляются письма',
          'Нажмите «Отправить тестовое письмо» для проверки',
        ],
        tips: [
          'Для Gmail используйте App Password вместо основного пароля',
          'Тестовое письмо отправляется на email администратора',
        ],
      },
      {
        heading: 'Резервное копирование',
        content: 'Настройте автоматическое резервное копирование базы данных. Бэкапы создаются ежедневно и хранятся 30 дней. Настройка: Настройки → Общие → Резервное копирование.',
      },
    ],
  },
  'API интеграции': {
    title: 'API интеграции',
    sections: [
      {
        heading: 'Обзор API',
        content: 'Omni Retail Core предоставляет REST API для интеграции с внешними системами. Базовый URL: https://your-domain/api/v1/. Для аутентификации используется API-ключ.',
        steps: [
          'Получите API-ключ: Настройки → API → «Создать ключ»',
          'Укажите название ключа (для чего он используется)',
          'Выберите права ключа: read-only или read-write',
          'Скопируйте ключ — он показывается только один раз!',
          'Используйте ключ в заголовке запросов: X-API-Key: ваш_ключ',
        ],
      },
      {
        heading: 'Основные эндпоинты',
        content: 'Доступные ресурсы API:',
        steps: [
          'GET /api/v1/products — список товаров (поддержка фильтрации и пагинации)',
          'GET /api/v1/orders — список заказов',
          'GET /api/v1/users — список пользователей (только admin)',
          'GET /api/v1/sales — данные о продажах',
          'POST /api/v1/reports — создание отчёта',
          'GET /api/v1/analytics — аналитические данные',
        ],
        tips: [
          'Лимит API: 1000 запросов в минуту на ключ',
          'Все ответы возвращаются в формате JSON',
          'Для пагинации используйте параметры ?page=1&limit=50',
        ],
      },
      {
        heading: 'Встроенные интеграции',
        content: 'Платформа имеет готовые интеграции:',
        steps: [
          'Apache Superset — BI-дашборды и визуализации (встроено)',
          'Telegram — отправка уведомлений в чат/канал',
          '1С — синхронизация товаров, заказов, остатков',
          'CDEK — расчёт стоимости и отслеживание доставок',
          'ЮKassa — обработка платежей',
        ],
      },
    ],
  },
  'Webhooks': {
    title: 'Настройка Webhooks',
    sections: [
      {
        heading: 'Что такое Webhooks',
        content: 'Webhooks позволяют получать уведомления о событиях в реальном времени. Когда происходит событие (новый заказ, изменение статуса), платформа отправляет POST-запрос на указанный URL.',
        steps: [
          'Перейдите в Настройки → Интеграции → Webhooks',
          'Нажмите «Добавить webhook»',
          'Укажите URL — конечную точку, которая будет получать уведомления',
          'Выберите события: order.created, order.updated, user.created, payment.completed',
          'Укажите секретный ключ — используется для подписи запросов (HMAC-SHA256)',
          'Нажмите «Сохранить»',
        ],
      },
      {
        heading: 'Формат webhook-запроса',
        content: 'Каждый webhook отправляется как POST-запрос с JSON-телом:',
        steps: [
          'Заголовок X-Webhook-Signature — HMAC-SHA256 подпись для проверки подлинности',
          'Заголовок Content-Type: application/json',
          'Тело: { "event": "order.created", "timestamp": "2024-01-15T10:30:00Z", "data": { ... } }',
        ],
        tips: [
          'Ваш сервер должен отвечать 200 OK в течение 5 секунд, иначе webhook будет повторён',
          'Максимум 3 повторных попытки с интервалом 30 секунд',
          'Историю отправок можно посмотреть в журнале webhook-ов',
        ],
      },
      {
        heading: 'Безопасность webhook-ов',
        content: 'Всегда проверяйте подпись X-Webhook-Signature на вашей стороне. Вычислите HMAC-SHA256 от тела запроса с вашим секретным ключом и сравните с заголовком. Если подписи не совпадают — игнорируйте запрос.',
      },
    ],
  },

  // ===== БЕЗОПАСНОСТЬ =====
  'Двухфакторная аутентификация': {
    title: 'Двухфакторная аутентификация (2FA)',
    sections: [
      {
        heading: 'Включение 2FA',
        content: 'Двухфакторная аутентификация добавляет второй уровень защиты. После ввода пароля потребуется ввести код из приложения-аутентификатора.',
        steps: [
          'Перейдите в Настройки → Безопасность',
          'Нажмите «Включить 2FA»',
          'Установите приложение Google Authenticator, Authy или Microsoft Authenticator на телефон',
          'Отсканируйте QR-код на экране через приложение',
          'Введите 6-значный код из приложения для подтверждения',
          'Сохраните резервные коды в безопасном месте — они понадобятся, если телефон будет недоступен',
        ],
        tips: [
          'Резервные коды — одноразовые, каждый можно использовать только один раз',
          'Храните резервные коды отдельно от телефона (распечатайте или сохраните в сейфе)',
          'Без 2FA аккаунт администратора не считается защищённым',
        ],
      },
      {
        heading: 'Отключение 2FA',
        content: 'Для отключения 2FA перейдите в Настройки → Безопасность → «Отключить 2FA». Потребуется ввести текущий код из приложения и пароль для подтверждения.',
        tips: [
          'При потере телефона используйте резервные коды для входа, затем отключите и заново включите 2FA',
        ],
      },
      {
        heading: 'Как работает 2FA',
        content: '2FA использует алгоритм TOTP (Time-Based One-Time Password). Каждые 30 секунд генерируется новый 6-значный код. Код зависит от секретного ключа (привязанного к вашему аккаунту) и текущего времени. Даже если злоумышленник узнает ваш пароль, без кода из приложения он не сможет войти.',
      },
    ],
  },
  'Журнал активности': {
    title: 'Журнал активности',
    sections: [
      {
        heading: 'Что записывается в журнал',
        content: 'Система записывает все важные действия пользователей в журнал аудита (схема system). Это включает:',
        steps: [
          'Входы и выходы из системы (успешные и неудачные)',
          'Изменение прав и ролей пользователей',
          'Создание, изменение и удаление товаров, заказов',
          'Экспорт данных и создание отчётов',
          'Изменение настроек системы',
          'IP-адрес, браузер и время каждого действия',
        ],
      },
      {
        heading: 'Просмотр журнала',
        content: 'Для просмотра журнала активности:',
        steps: [
          'Перейдите в Настройки → Безопасность → Журнал активности',
          'Используйте фильтры: пользователь, действие, дата, IP-адрес',
          'Нажмите на запись для просмотра деталей',
          'Экспортируйте журнал в CSV для внешнего анализа',
        ],
        tips: [
          'Журнал хранится 90 дней, затем архивируется',
          'Подозрительные действия (вход с нового IP, множественные неудачные входы) выделяются красным',
          'Только администраторы могут просматривать журнал',
        ],
      },
      {
        heading: 'Что делать при подозрительной активности',
        content: 'Если вы обнаружили несанкционированные действия в журнале:',
        steps: [
          'Немедленно смените пароль',
          'Включите 2FA, если ещё не включён',
          'Завершите все активные сессии (Настройки → Безопасность → «Завершить все сессии»)',
          'Сообщите в службу поддержки с указанием записей из журнала',
        ],
      },
    ],
  },
  'Политика паролей': {
    title: 'Политика паролей',
    sections: [
      {
        heading: 'Требования к паролю',
        content: 'Все пароли в системе должны соответствовать следующим требованиям:',
        steps: [
          'Минимальная длина: 8 символов (рекомендуется 12+)',
          'Минимум 1 заглавная буква (A-Z)',
          'Минимум 1 строчная буква (a-z)',
          'Минимум 1 цифра (0-9)',
          'Минимум 1 специальный символ (!@#$%^&*())',
          'Пароль не должен содержать email или имя пользователя',
        ],
      },
      {
        heading: 'Рекомендации по безопасности',
        content: 'Для максимальной защиты следуйте этим рекомендациям:',
        steps: [
          'Используйте уникальные пароли для каждой системы',
          'Рассмотрите использование менеджера паролей (Bitwarden, 1Password, KeePass)',
          'Не передавайте пароли коллегам и не записывайте их в открытых местах',
          'Меняйте пароль каждые 90 дней (или при подозрении на компрометацию)',
          'Не используйте пароли из прошлых 5 изменений',
        ],
        tips: [
          'Хороший пароль: "Gr3n!Tee#Sun9" — 13 символов, заглавные, строчные, цифры, спецсимволы',
          'Плохой пароль: "password123" — слишком простой, есть в словарях',
        ],
      },
      {
        heading: 'Блокировка аккаунта',
        content: 'После 5 неудачных попыток входа аккаунт блокируется на 15 минут. После 10 попыток — на 1 час. Администратор может разблокировать аккаунт вручную через раздел «Пользователи».',
      },
    ],
  },
};

const documentationSections = [
  {
    title: 'REST API',
    description: 'Эндпоинты, аутентификация, примеры запросов',
    icon: Globe,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    items: [
      { label: 'Аутентификация (API Keys)', endpoint: 'GET /api/v1/auth', method: 'GET' },
      { label: 'Список товаров', endpoint: 'GET /api/v1/products', method: 'GET' },
      { label: 'Список заказов', endpoint: 'GET /api/v1/orders', method: 'GET' },
      { label: 'Данные пользователей', endpoint: 'GET /api/v1/users', method: 'GET' },
      { label: 'Аналитика продаж', endpoint: 'GET /api/v1/sales', method: 'GET' },
      { label: 'Создание отчёта', endpoint: 'POST /api/v1/reports', method: 'POST' },
    ],
  },
  {
    title: 'Webhooks',
    description: 'Настройка уведомлений о событиях в реальном времени',
    icon: Webhook,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    items: [
      { label: 'Создание заказа', endpoint: 'order.created', method: 'POST' },
      { label: 'Обновление заказа', endpoint: 'order.updated', method: 'POST' },
      { label: 'Новый пользователь', endpoint: 'user.created', method: 'POST' },
      { label: 'Завершение платежа', endpoint: 'payment.completed', method: 'POST' },
    ],
  },
  {
    title: 'Интеграции',
    description: 'Подключение внешних сервисов',
    icon: Globe2,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    items: [
      { label: 'Apache Superset — BI-дашборды', endpoint: 'Встроено', method: '' },
      { label: 'Telegram — уведомления', endpoint: 'Настройки → Интеграции', method: '' },
      { label: '1С — синхронизация товаров', endpoint: 'Настройки → Интеграции', method: '' },
      { label: 'CDEK — доставки', endpoint: 'Настройки → Интеграции', method: '' },
      { label: 'ЮKassa — платежи', endpoint: 'Настройки → Интеграции', method: '' },
    ],
  },
  {
    title: 'ETL Pipelines',
    description: 'Пайплайны данных: PostgreSQL → ClickHouse',
    icon: Activity,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    items: [
      { label: 'PostgreSQL → S3 (Parquet)', endpoint: 'Airflow: postgres_to_s3', method: '' },
      { label: 'ClickHouse → S3 (Parquet)', endpoint: 'Airflow: clickhouse_to_s3', method: '' },
      { label: 'CDC: PostgreSQL → Kafka', endpoint: 'Debezium connector', method: '' },
      { label: 'Kafka → Flink → ClickHouse', endpoint: 'Real-time streaming', method: '' },
    ],
  },
];

interface ChangelogEntry {
  sha: string;
  date: string;
  message: string;
  author: string;
}

const SUPPORT_EMAIL = 'stratum-platform@mail.ru';
const SUPPORT_PHONE = '+375 (29) 567-77-92';

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
    answer: `Вы можете написать на ${SUPPORT_EMAIL}, позвонить по телефону ${SUPPORT_PHONE} или создать тикет в разделе "Поддержка".`,
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
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Changelog state
  const [showDocModal, setShowDocModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [changelogLoading, setChangelogLoading] = useState(false);
  const [changelogError, setChangelogError] = useState<string | null>(null);
  const changelogFetchedRef = useRef(false);

  // Ticket states
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSubmitSuccess, setTicketSubmitSuccess] = useState(false);
  const ticketsFetchedRef = useRef(false);

  const PRODUCTS_API = '/api/products';
  const TICKETS_API = '/api/support-tickets';
  const EMAIL_API = '/api/email';

  // Helpers for ticket display
  const getTicketStatusLabel = (status: string) => {
    const labels: Record<string, string> = { open: 'Открыт', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт' };
    return labels[status] || status;
  };
  const getTicketStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    };
    return colors[status] || colors.open;
  };
  const getTicketPriorityLabel = (p: string) => {
    const labels: Record<string, string> = { low: 'Низкий', normal: 'Обычный', high: 'Высокий', critical: 'Критический' };
    return labels[p] || p;
  };
  const getTicketPriorityColor = (p: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[p] || colors.normal;
  };
  const formatTicketDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  // Fetch user tickets
  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const user = localStorage.getItem('admin-user');
      let userEmail = '';
      let userRole = '';
      if (user) {
        try {
          const parsed = JSON.parse(user);
          userEmail = parsed.email || '';
          userRole = parsed.role || '';
        } catch {}
      }
      // Admin sees all tickets, others see only their own (by email)
      const url = userRole === 'admin' ? TICKETS_API : (userEmail ? `${TICKETS_API}?user_email=${encodeURIComponent(userEmail)}` : TICKETS_API);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUserTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('Failed to fetch tickets:', e);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  // Fetch changelog from GitHub API (via nginx proxy to avoid CORS)
  const fetchChangelog = useCallback(async () => {
    setChangelogLoading(true);
    setChangelogError(null);
    try {
      const res = await fetch('/api/github/repos/whiteprincewithobsession/analytical-platform/commits?per_page=50');
      if (res.ok) {
        const data = await res.json();
        const entries: ChangelogEntry[] = data.map((commit: any) => ({
          sha: commit.sha.substring(0, 7),
          date: commit.commit.author?.date || commit.commit.committer?.date || '',
          message: commit.commit.message,
          author: commit.commit.author?.name || commit.commit.committer?.name || 'Unknown',
        }));
        setChangelogEntries(entries);
        return;
      }
      setChangelogError('Не удалось загрузить changelog. Попробуйте позже.');
    } catch (e) {
      setChangelogError('Ошибка сети при загрузке changelog.');
      console.error('Failed to fetch changelog:', e);
    } finally {
      setChangelogLoading(false);
    }
  }, []);

  // Fetch single ticket detail
  const fetchTicketDetail = async (ticketId: number) => {
    setTicketDetailLoading(true);
    setAdminReplyText('');
    try {
      const res = await fetch(`${TICKETS_API}/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicketDetail(data);
      }
    } catch (e) {
      console.error('Failed to fetch ticket detail:', e);
    } finally {
      setTicketDetailLoading(false);
    }
  };

  // Create ticket
  const handleCreateTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) return;
    setTicketSubmitting(true);
    try {
      const user = localStorage.getItem('admin-user');
      let userData: any = {};
      if (user) {
        try { userData = JSON.parse(user); } catch {}
      }
      const res = await fetch(TICKETS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.id || null,
          user_email: userData.email || 'user@example.com',
          user_name: userData.name || userData.email || 'User',
          subject: ticketForm.subject,
          message: ticketForm.message,
          priority: ticketForm.priority,
        }),
      });
      if (res.ok) {
        setTicketSubmitSuccess(true);
        fetchTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Ошибка: ${err.error || 'Не удалось создать обращение'}`);
      }
    } catch (e) {
      alert('Ошибка сети. Проверьте подключение.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Admin reply
  const handleAdminReply = async () => {
    if (!adminReplyText.trim() || !selectedTicket) return;
    setReplySubmitting(true);
    try {
      const user = localStorage.getItem('admin-user');
      let userData: any = {};
      if (user) { try { userData = JSON.parse(user); } catch {} }
      const res = await fetch(`${TICKETS_API}/${selectedTicket}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: adminReplyText,
          admin_id: userData.id || null,
          admin_name: userData.name || 'Admin',
          send_email: true,
        }),
      });
      if (res.ok) {
        fetchTicketDetail(selectedTicket);
        fetchTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Ошибка: ${err.error || 'Не удалось отправить ответ'}`);
      }
    } catch (e) {
      alert('Ошибка сети.');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Change ticket status
  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      const res = await fetch(`${TICKETS_API}/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTicketDetail(ticketId);
        fetchTickets();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  // Load tickets on support tab open
  useEffect(() => {
    if (isOpen && activeTab === 'support' && !ticketsFetchedRef.current && !ticketsLoading) {
      ticketsFetchedRef.current = true;
      fetchTickets();
    }
    if (activeTab !== 'support') {
      ticketsFetchedRef.current = false;
    }
  }, [isOpen, activeTab, fetchTickets]);

  // Load changelog when changelog modal opens
  useEffect(() => {
    if (showChangelogModal && !changelogFetchedRef.current && !changelogLoading) {
      changelogFetchedRef.current = true;
      fetchChangelog();
    }
    if (!showChangelogModal) {
      changelogFetchedRef.current = false;
    }
  }, [showChangelogModal, fetchChangelog]);

  if (!isOpen) return null;

  const filteredFaq = faqItems.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {}
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
          {}
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

          {}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {}
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

                {}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Быстрые ссылки
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Документация</span>
                    </button>
                    <button
                      onClick={() => setShowChangelogModal(true)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <GitCommit className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Changelog</span>
                    </button>
                    <button
                      className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <Video className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Видеоуроки</span>
                    </button>
                    <button
                      className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Сообщество</span>
                    </button>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Email</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{SUPPORT_EMAIL}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ответ в течение 24 часов</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Телефон</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{SUPPORT_PHONE}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Пн-Пт, 9:00 - 18:00</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'guides' && !selectedArticle && (
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
                                onClick={() => setSelectedArticle(article)}
                                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
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

            {activeTab === 'guides' && selectedArticle && guideArticles[selectedArticle] && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад к руководствам
                </button>
                <div className="flex items-center gap-3">
                  <Book className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {guideArticles[selectedArticle].title}
                  </h3>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700" />
                {guideArticles[selectedArticle].sections.map((section, si) => {
                  const SectionIcon = section.icon || FileText;
                  return (
                    <div key={si} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <SectionIcon className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {section.heading}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {section.content}
                      </p>
                      {section.steps && (
                        <ol className="space-y-2 ml-1">
                          {section.steps.map((step, sti) => (
                            <li key={sti} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-semibold mt-0.5">
                                {sti + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                      {section.tips && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1.5">
                          {section.tips.map((tip, ti) => (
                            <div key={ti} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="text-amber-800 dark:text-amber-300">{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {si < guideArticles[selectedArticle].sections.length - 1 && (
                        <div className="border-b border-gray-100 dark:border-gray-700/50" />
                      )}
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
                {/* Форма создания обращения */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Создать обращение
                  </h3>
                  {ticketSubmitSuccess ? (
                    <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                        Обращение создано!
                      </h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Мы ответим вам в ближайшее время. Уведомление придёт на email.
                      </p>
                      <button
                        onClick={() => { setTicketSubmitSuccess(false); setTicketForm({ subject: '', message: '', priority: 'normal' }); }}
                        className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Создать ещё одно
                      </button>
                    </div>
                  ) : (
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
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      <button
                        onClick={handleCreateTicket}
                        disabled={ticketSubmitting || !ticketForm.subject.trim() || !ticketForm.message.trim()}
                        className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {ticketSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Отправка...
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5" />
                            Отправить обращение
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Список обращений */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Ваши обращения
                    </h3>
                    <button
                      onClick={() => fetchTickets()}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                      title="Обновить"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  {ticketsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  ) : userTickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                      <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">У вас пока нет обращений</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userTickets.map(ticket => (
                        <div
                          key={ticket.id}
                          className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                        >
                          <button
                            onClick={() => { setSelectedTicket(ticket.id); fetchTicketDetail(ticket.id); }}
                            className="flex items-center gap-3 text-left flex-1 min-w-0"
                          >
                            {ticket.status === 'resolved' ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            ) : ticket.status === 'closed' ? (
                              <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            ) : ticket.status === 'in_progress' ? (
                              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {ticket.subject}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                #{ticket.id} • {ticket.user_email} • {formatTicketDate(ticket.created_at)}
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              getTicketStatusColor(ticket.status)
                            }`}>
                              {getTicketStatusLabel(ticket.status)}
                            </span>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              getTicketPriorityColor(ticket.priority)
                            }`}>
                              {getTicketPriorityLabel(ticket.priority)}
                            </span>
                            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, 'resolved'); }}
                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Отметить как решённый"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documentation Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDocModal(false)}>
          <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Техническая документация</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Эндпоинты API, интеграции и пайплайны данных</p>
                </div>
              </div>
              <button onClick={() => setShowDocModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {documentationSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div key={index} className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${section.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{section.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                          <div className="flex items-center gap-2">
                            {item.method && (
                              <span className={`px-2 py-0.5 text-xs font-mono font-semibold rounded ${
                                item.method === 'GET'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : item.method === 'POST'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {item.method}
                              </span>
                            )}
                            <code className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {item.endpoint}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Changelog Modal */}
      {showChangelogModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowChangelogModal(false)}>
          <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <GitCommit className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">История изменений</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Последние коммиты из репозитория</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { changelogFetchedRef.current = false; fetchChangelog(); }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                  title="Обновить"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => setShowChangelogModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {changelogLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Загрузка...</span>
                </div>
              ) : changelogError ? (
                <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600 dark:text-red-400">{changelogError}</p>
                </div>
              ) : changelogEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <GitCommit className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет данных о коммитах</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {changelogEntries.map((entry) => {
                    const dateObj = entry.date ? new Date(entry.date) : null;
                    const dateStr = dateObj
                      ? dateObj.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    const commitMatch = entry.message.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?:\s*(.+)$/);
                    const commitType = commitMatch ? commitMatch[1] : '';
                    const commitMsg = commitMatch ? commitMatch[3] : entry.message;

                    const typeColors: Record<string, string> = {
                      feat: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                      fix: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      docs: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                      refactor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                      perf: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      test: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
                    };

                    return (
                      <div
                        key={entry.sha}
                        className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <GitCommit className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {commitType && (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[commitType] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {commitType}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {commitMsg}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-mono">{entry.sha}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {dateStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {entry.author}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && ticketDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 corporate:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 corporate:border-slate-600">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    #{ticketDetail.id} {ticketDetail.subject}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTicketStatusColor(ticketDetail.status)}`}>
                      {getTicketStatusLabel(ticketDetail.status)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTicketPriorityColor(ticketDetail.priority)}`}>
                      {getTicketPriorityLabel(ticketDetail.priority)}
                    </span>
                    <span className="text-xs text-gray-400">{formatTicketDate(ticketDetail.created_at)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Original message */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {(ticketDetail.user_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{ticketDetail.user_name || ticketDetail.user_email}</span>
                    {ticketDetail.user_email && ticketDetail.user_name && (
                      <span className="text-xs text-gray-400 ml-1">&lt;{ticketDetail.user_email}&gt;</span>
                    )}
                    <span className="text-xs text-gray-400 ml-2">{formatTicketDate(ticketDetail.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticketDetail.message}</p>
              </div>

              {/* Messages thread */}
              {ticketDetail.messages && ticketDetail.messages.length > 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Переписка</h4>
                  {ticketDetail.messages.slice(1).map((msg: any) => (
                    <div key={msg.id} className={`p-4 rounded-xl border ${
                      msg.sender_type === 'admin'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          msg.sender_type === 'admin'
                            ? 'bg-indigo-200 dark:bg-indigo-800'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          <span className="text-xs font-semibold">{(msg.sender_name || 'A')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{msg.sender_name}</span>
                          {msg.is_internal && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">internal</span>
                          )}
                          <span className="text-xs text-gray-400 ml-2">{formatTicketDate(msg.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin reply form */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ответить</h4>
                <textarea
                  value={adminReplyText}
                  onChange={e => setAdminReplyText(e.target.value)}
                  rows={3}
                  placeholder="Введите ответ..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleAdminReply}
                    disabled={replySubmitting || !adminReplyText.trim()}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {replySubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Отправка...</>
                    ) : (
                      <>Отправить ответ</>
                    )}
                  </button>
                  <select
                    value={ticketDetail.status}
                    onChange={e => handleStatusChange(selectedTicket, e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="open">Открыт</option>
                    <option value="in_progress">В работе</option>
                    <option value="resolved">Решён</option>
                    <option value="closed">Закрыт</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
