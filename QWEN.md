# Marketplace Analytics Platform — Full Context Guide

## Project Overview

Это **дипломный проект** — полнофункциональная аналитическая платформа для маркетплейса (retail/e-commerce). Платформа реализует полный цикл данных: от операционной БД (PostgreSQL) через OLAP-хранилище (ClickHouse) до визуализации (Apache Superset) с единым веб-интерфейсом на React.

**Архитектура**: микросервисы в Docker-контейнерах, оркестрация ETL через Airflow, обработка через Spark.

### Key Technologies

| Компонент | Технология | Назначение |
|-----------|------------|------------|
| **Frontend** | React 19 + TypeScript + Vite 7 | SPA админ-панель |
| **Styling** | Tailwind CSS 4 | UI стилизация |
| **OLTP** | PostgreSQL 16 + PostGIS | Операционная БД |
| **OLAP** | ClickHouse | Аналитическое хранилище |
| **BI** | Apache Superset 4.0.1 | Дашборды и визуализация |
| **ETL** | Apache Airflow 2.9.3 | Оркестрация пайплайнов |
| **Processing** | Apache Spark 3.5.1 | Batch обработка |
| **Streaming** | Apache Kafka 7.6.0 | Брокер сообщений (KRaft) |
| **Stream Processing** | Apache Flink 1.18.1 | Real-time обработка |
| **Storage** | LocalStack (S3) | Parquet-экспорты |
| **Containerization** | Docker Compose | Все сервисы в контейнерах |

---

## Architecture Diagram

```
                    +-----------------+
                    |   Nginx (:3000) |
                    |  React SPA +    |
                    |  Superset proxy |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
    +---------v----+  +------v-----+  +-----v--------+
    | PostgreSQL   |  | ClickHouse |  |   Superset   |
    |   (:5430)    |  |  (:8123)   |  |   (:8088)    |
    |  OLTP        |  |   OLAP     |  |  BI/Dashboard|
    +------+-------+  +------+-----+  +-----+--------+
           |                 |              |
           |     +-----------+--------------+
           |     |
    +------v-----v------+     +------------+
    |    Airflow        |     | LocalStack |
    |    (:8080)        |---->| S3 (:4566) |
    |  ETL Orchestration|    | Parquet    |
    +-------------------+     +------------+

    +-------------------+     +-------------------+     +-----------------+
    |    Spark          |     |    Kafka          |     |    Flink        |
    |  (:7077)          |     |  (:9092)          |     |  (:8084 UI)     |
    |  1 Master + 2 W   |     |  KRaft mode       |     |  1 JM + 1 TM    |
    +-------------------+     |  UI: :8090        |     +-----------------+
                              +--------+----------+
                                       |
                              Real-time events → CDC → ClickHouse
```

---

## Project Structure

```
d:\studying\diplom\
├── docker-compose.yml              # Основные сервисы (PG, CH, S3, Superset)
├── docker-compose.airflow.yml      # Airflow кластер
├── docker-compose.spark.yml        # Spark кластер
├── docker-compose.frontend.yml     # Frontend (Nginx + React)
├── docker-compose.streaming.yml    # Kafka + Flink (streaming pipeline)
│
├── front-end/                      # React приложение
│   ├── src/
│   │   ├── components/             # UI компоненты
│   │   │   ├── ui/                 # Переиспользуемые примитивы
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── SupersetLoginGate.tsx
│   │   │   ├── SupersetDashboard.tsx
│   │   │   └── PermissionGate.tsx
│   │   ├── contexts/               # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   ├── LocalizationContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   ├── pages/                  # Страницы приложения
│   │   │   ├── OverviewPage.tsx
│   │   │   ├── DashboardsPage.tsx
│   │   │   ├── SalesPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── config/
│   │   │   └── permissions.ts      # Матрица RBAC (4 роли)
│   │   ├── locales/                # i18n (ru.json, en.json)
│   │   ├── App.tsx                 # Главный компонент
│   │   ├── main.tsx                # Точка входа
│   │   └── index.css               # Tailwind + глобальные стили
│   ├── Dockerfile                  # Multi-stage: node builder + nginx
│   ├── nginx.conf                  # Прокси на Superset, авто-логин
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── postgres/                       # PostgreSQL OLTP
│   ├── config/                     # Конфигурация
│   ├── data/                       # Данные БД
│   ├── logs/                       # Логи
│   └── postgres_arch/              # DDL/VIEWS/TRIGGERS архив
│       ├── _ddl_init/              # Инициализация схем
│       ├── _infra/indexes/         # Индексы
│       ├── _infra/triggers/        # Триггеры
│       ├── _views/                 # Представления
│       └── diagnostics/            # Скрипты диагностики
│
├── clickhouse/                     # ClickHouse OLAP
│   ├── clickhouse-init/            # Init скрипты
│   ├── clickhouse_arch/            # DDL/MV/Views архив
│   │   ├── tables/                 # Определение таблиц
│   │   ├── materialized_views/     # Materialized Views
│   │   └── views/                  # Представления
│   ├── data/                       # Данные
│   └── logs/                       # Логи
│
├── airflow/                        # Apache Airflow
│   ├── dags/                       # ETL DAGs
│   │   ├── postgres_to_s3.py       # Экспорт PG -> S3
│   │   └── clickhouse_to_s3.py     # Экспорт CH -> S3
│   ├── plugins/                    # Кастомные плагины
│   └── logs/                       # Логи запусков
│
├── spark/                          # Apache Spark
│   ├── jobs/                       # Spark Jobs (пусто, готов)
│   └── work/                       # Рабочая директория
│
├── flink/                          # Apache Flink + Kafka streaming
│   ├── README.md                   # Документация по streaming pipeline
│   ├── jobs/                       # Flink jobs (SQL + JAR)
│   │   └── orders-processing.sql   # Пример: orders aggregation → ClickHouse
│   ├── connectors/                 # Kafka, ClickHouse коннекторы
│   └── generate_mock_events.py     # Генератор mock-событий для Kafka
│
├── superset-custom/                # Apache Superset кастомизация
│   ├── superset_config.py          # Конфигурация
│   ├── assign_gamma.py             # Скрипт назначения ролей
│   ├── assign_public_role.py       # Скрипт назначения Public
│   └── assign_public_slices.py     # Скрипт публичных чартов
│
├── superset_home\superset/         # Метаданные Superset
│
├── supersetdb_data/                # PG для метаданных Superset
│   ├── data/                       # Данные
│   └── backups/                    # Бэкапы
│
├── clickhouse_data/                # Данные ClickHouse (дубль)
├── clickhouse_logs/                # Логи ClickHouse (дубль)
├── airflow_dags/                   # DAGs (дубль)
├── airflow_logs/                   # Логи Airflow (дубль)
├── airflow_plugins/                # Плагины Airflow (дубль)
├── postgres_config/                # Конфиг PG (дубль)
├── postgres_data/                  # Данные PG (дубль)
├── postgres_logs/                  # Логи PG (дубль)
│
├── tests/                          # Тесты
│   └── pg_tests.py                 # pytest для PostgreSQL (878 строк)
│
├── docker/                         # Docker утилиты
│   └── requirements-local.txt      # Зависимости для Superset
│
├── .kilocode/                      # KiloCode extension config
└── .kilo/                          # Setup scripts
```

---

## Services & Ports

### Основные сервисы (docker-compose.yml)

| Сервис | Порт | Описание |
|--------|------|----------|
| PostgreSQL | `5430` | OLTP БД маркетплейса |
| ClickHouse HTTP | `8123` | HTTP интерфейс ClickHouse |
| ClickHouse Native | `9000` | Native интерфейс ClickHouse |
| LocalStack | `4566` | Эмуляция AWS S3 |
| Superset | `8088` | BI платформа |
| Superset DB | `5431` | PostgreSQL для метаданных Superset |

### Airflow (docker-compose.airflow.yml)

| Сервис | Порт | Описание |
|--------|------|----------|
| Airflow DB | `5433` | PostgreSQL для Airflow |
| Airflow Webserver | `8080` | Web UI Airflow |

### Spark (docker-compose.spark.yml)

| Сервис | Порт | Описание |
|--------|------|----------|
| Spark Master | `7077` | Master Spark |
| Spark Master UI | `8081` | UI Master |
| Spark Worker 1 UI | `8082` | UI Worker 1 |
| Spark Worker 2 UI | `8083` | UI Worker 2 |

### Frontend (docker-compose.frontend.yml)

| Сервис | Порт | Описание |
|--------|------|----------|
| Nginx + React | `3000` | Frontend приложение |

### Streaming (docker-compose.streaming.yml)

| Сервис | Порт | Описание |
|--------|------|----------|
| Kafka | `9092` | Брокер сообщений (KRaft mode, без ZooKeeper) |
| Kafka Controller | `9093` | KRaft controller port |
| Kafka UI | `8090` | Web-интерфейс для управления Kafka |
| Flink JobManager | `8084` | Flink Web UI + координация jobs |
| Flink TaskManager | — | Execution engine (4 task slots) |
| Flink SQL Client | — | Интерактивный SQL (profile: tools) |

**Kafka Topics (auto-created at startup):**
| Topic | Partitions | Retention | Назначение |
|-------|------------|-----------|------------|
| `orders-events` | 3 | 7 days | События заказов |
| `sales-stream` | 3 | 7 days | Поток продаж (real-time) |
| `user-activity` | 3 | 3 days | Активность пользователей |
| `inventory-updates` | 2 | 3 days | Обновления остатков |
| `cdc-postgres` | 4 | 7 days | CDC из PostgreSQL (Debezium) |
| `flink-sink-clickhouse` | 3 | 7 days | Sink в ClickHouse |

**Flink Configuration:**
- JobManager: 1GB RAM, TaskManager: 1.7GB RAM × 1
- Task slots: 4 (иттого 8 параллельных задач)
- State backend: RocksDB
- Checkpointing: каждые 60s, EXACTLY_ONCE
- Restart strategy: fixed-delay (3 попытки, 10s интервал)
- Default parallelism: 2

---

## Database Schema

### PostgreSQL (OLTP) — База: `omni_retail_core`

**7 схем:**
- `core` — пользователи, роли, настройки
- `cart` — корзины и их элементы
- `catalog` — товары и категории
- `feedback` — отзывы и вопросы
- `promo` — промокоды и программы лояльности
- `sales` — заказы и платежи
- `system` — логи и аудит

**~30+ таблиц:**

| Таблица | Описание |
|---------|----------|
| users | Пользователи маркетплейса |
| roles | Роли RBAC |
| products | Товары (с JSONB metadata) |
| categories | Категории товаров (иерархия) |
| orders | Заказы |
| order_items | Элементы заказов |
| cart | Корзины |
| cart_items | Элементы корзин |
| inventory | Остатки на складах |
| warehouses | Склады (с PostGIS) |
| reviews | Отзывы |
| promotions | Промо-акции |
| loyalty_programs | Программы лояльности |
| payment_methods | Способы оплаты (с JSONB meta) |
| deliveries | Доставки |

**Особенности:**
- JSONB колонки: `user_profile`, `product_metadata`, `payment_methods`
- Индексы, триггеры (updated_at), CHECK ограничения
- FOREIGN KEY с CASCADE DELETE
- UNIQUE ограничения на email
- PostGIS для геоданных складов

### ClickHouse (OLAP) — База: `analytics`

**Таблицы-факты:**
| Таблица | Описание | Движок |
|---------|----------|--------|
| customer_metrics | Метрики клиентов | ReplacingMergeTree |
| customer_loyalty | Данные лояльности | ReplacingMergeTree |
| customer_facts | Факты о клиентах | ReplacingMergeTree |
| customer_preferences | Предпочтения | ReplacingMergeTree |
| customer_channels | Каналы клиентов | ReplacingMergeTree |
| orders_facts | Факты заказов | ReplacingMergeTree |

**Materialized Views:**
- `mv_orders_revenue_trend` — тренд выручки заказов
- `mv_active_customers_30d` — активные клиенты за 30 дней
- `mv_churn_health` — здоровье оттока
- `mv_loyalty_promo` — связь лояльности и промо
- `mv_new_vs_repeat` — новые vs повторные клиенты
- `mv_order_funnel` — воронка заказов
- `mv_top_categories` — топ категории

**Views:**
- `v_customer_360_intelligence` — полный профиль клиента (объединяет все MV)

---

## ETL Pipelines

### Архитектура данных

```
PostgreSQL (OLTP)  -->  Airflow DAG  -->  S3/LocalStack (Parquet)
ClickHouse (OLAP)  -->  Airflow DAG  -->  S3/LocalStack (Parquet)
                                                  |
                                            (подготовка для Spark)
```

### DAG: `postgres_to_s3`
- **Tasks:** `test_connections` → `get_tables` → `export_tables` → `create_summary`
- **Схемы:** cart, catalog, core, system, feedback, promo, sales
- **Лимит:** 50,000 строк на таблицу
- **Конвертация:** UUID, Decimal, JSONB, memoryview → строки/JSON
- **Формат:** Parquet (snappy compression)
- **Партиционирование:** `postgres/{schema}/{table}/dt={date}/`
- **Manifest:** JSON с метаданными экспорта

### DAG: `clickhouse_to_s3`
- **Tasks:** `test_connections` → `get_tables` → `export_tables` → `create_summary`
- **Лимит:** 10,000 строк на таблицу
- **Конвертация:** Array/Tuple/Dict → JSON
- **Формат:** Parquet (snappy compression)
- **Партиционирование:** `clickhouse/{table}/dt={date}/`
- **Manifest:** JSON с метаданными экспорта

### S3 Buckets (LocalStack)
- `clickhouse-exports` — экспорты из ClickHouse
- `postgres-exports` — экспорты из PostgreSQL

---

## Frontend (React 19 + TypeScript + Vite 7)

### Структура приложения

**Точка входа:** `front-end/src/main.tsx` → `App.tsx`

**Роутинг:** React Router (встроен в App.tsx)

**Страницы:**
| Страница | Путь | Описание |
|----------|------|----------|
| Overview | `/` | Главная панель |
| Dashboards | `/dashboards` | Superset дашборды (iframe) |
| Sales | `/sales` | Аналитика продаж |
| Products | `/products` | Управление товарами |
| Analytics | `/analytics` | Аналитика |
| Reports | `/reports` | Отчёты |
| Users | `/users` | Управление пользователями |
| Settings | `/settings` | Настройки |

### RBAC (4 роли)

| Роль | Права | Доступ |
|------|-------|--------|
| `admin` | Все 22 permission | Полный доступ ко всему |
| `analyst` | view_analytics, export_data, create_reports, view_financials | Аналитика и отчёты |
| `manager` | edit_products, edit_orders, manage_promotions | Управление товарами/заказами |
| `spectator` | view_dashboard, view_sales, view_products | Только просмотр |

### Аутентификация
**Двухуровневая:**
1. **Superset-логин** — через nginx proxy с авто-подстановкой `admin/admin`
2. **Моковая роль** — localStorage с ролью (admin/analyst/manager/viewer)

### Тема и локализация
- **Темы:** light / dark / corporate
- **Языки:** Русский (RU) / English (EN) — 481+ строк переводов
- **Иконки:** Lucide React

### Superset Integration
- **SupersetLoginGate.tsx** — шлюз аутентификации
- **SupersetDashboard.tsx** — встраивание дашбордов через iframe
- **Nginx proxy** — авто-логин в Superset через `sub_filter`
- **API endpoints** через прокси:
  - `GET /api/v1/dashboard/` — список дашбордов
  - `GET /api/v1/me/` — проверка аутентификации

---

## Superset Configuration

### superset_config.py
```python
FEATURE_FLAGS = {
    'EMBEDDED_SUPERSET': True,
    'DASHBOARD_CROSS_FILTERS': True,
}
CORS_OPTIONS = {'origins': ['*']}  # Разрешено для всех
CSRF_ENABLED = False
PUBLIC_ROLE_LIKE_GAMMA = True
```

### Скрипты автоматизации
| Скрипт | Назначение |
|--------|------------|
| `assign_gamma.py` | Назначает Gamma-роль на дашборд |
| `assign_public_role.py` | Назначает Public/Gamma роли |
| `assign_public_slices.py` | Делает чарты публичными через парсинг position_json |

---

## Testing

### pytest для PostgreSQL
**Файл:** `tests/pg_tests.py` (878 строк)

**Покрывает:**
- ✅ Структуру БД: таблицы, колонки, PK/FK/UNIQUE ключи
- ✅ Качество данных: NULL в email, цены > 0, нет заказов из будущего
- ✅ Ограничения: дубли email, FK-нарушения, CHECK (рейтинг 1-5, остатки > 0)
- ✅ JSONB колонки: чтение/запись вложенных полей
- ✅ Триггеры: updated_at для cart, products, payment_methods
- ✅ Бизнес-логику: итоги корзины/заказа, уникальность rank в loyalty
- ✅ CASCADE DELETE: пользователь → корзина → позиции
- ✅ Сложные запросы: JOIN, рекурсивные CTE (иерархия категорий)

**Запуск:**
```bash
cd d:\studying\diplom
pytest tests/pg_tests.py
```

---

## Development Workflow

### Запуск всех сервисов

```bash
# Из корня проекта (d:\studying\diplom)

# 1. Основные сервисы
docker compose up -d

# 2. Airflow
docker compose -f docker-compose.airflow.yml up -d

# 3. Spark (опционально)
docker compose -f docker-compose.spark.yml up -d

# 4. Frontend
docker compose -f docker-compose.frontend.yml up -d
```

### Frontend разработка

```bash
cd front-end
npm install          # Установка зависимостей
npm run dev          # Dev сервер (http://localhost:5173)
npm run build        # Production сборка
npm run preview      # Предпросмотр production сборки
```

### Доступ к сервисам

| Сервис | URL | Логин/Пароль |
|--------|-----|--------------|
| Frontend | `http://localhost:3000` | — |
| Superset | `http://localhost:8088` | admin/admin |
| Airflow | `http://localhost:8080` | airflow/airflow |
| Spark Master | `http://localhost:8081` | — |
| LocalStack | `http://localhost:4566` | — |
| ClickHouse | `http://localhost:8123` | default/ (пустой) |

---

## Key Files Reference

| Файл | Путь | Назначение |
|------|------|------------|
| Основной compose | `docker-compose.yml` | PG, CH, S3, Superset |
| Airflow compose | `docker-compose.airflow.yml` | Airflow кластер |
| Spark compose | `docker-compose.spark.yml` | Spark кластер |
| Frontend compose | `docker-compose.frontend.yml` | Nginx + React |
| React entry | `front-end/src/main.tsx` | Точка входа React |
| Main app | `front-end/src/App.tsx` | Главный компонент |
| Permissions | `front-end/src/config/permissions.ts` | RBAC матрица |
| PG DDL | `postgres/postgres_arch/_ddl_init/01_create_schemas.sql` | Создание схем |
| CH init | `clickhouse/clickhouse-init/init.sql` | Инициализация ClickHouse |
| Superset config | `superset-custom/superset_config.py` | Конфиг Superset |
| DAG PG->S3 | `airflow/dags/postgres_to_s3.py` | Экспорт PostgreSQL |
| DAG CH->S3 | `airflow/dags/clickhouse_to_s3.py` | Экспорт ClickHouse |
| Tests | `tests/pg_tests.py` | Тесты PostgreSQL |

---

## Common Tasks

### Работа с данными

```bash
# Подключение к PostgreSQL
docker exec -it <pg_container> psql -U postgres -d omni_retail_core

# Подключение к ClickHouse
docker exec -it <ch_container> clickhouse-client --database analytics

# Просмотр S3 buckets
aws --endpoint-url http://localhost:4566 s3 ls

# Логи Airflow
docker logs -f <airflow_webserver_container>
```

### ETL Pipeline

```bash
# Запуск DAG вручную через Airflow UI (localhost:8080)
# Или через CLI:
docker exec -it <airflow_webserver> airflow dags trigger postgres_to_s3
```

### Frontend + Superset Integration

Frontend встраивает Superset дашборды через iframe:
1. Nginx проксирует `/superset/` → `http://superset:8088`
2. Авто-логин через `sub_filter` в nginx.conf
3. React компонент `SupersetDashboard.tsx` загружает дашборды

---

## Environment Variables

### PostgreSQL
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=postgres`
- `POSTGRES_DB=omni_retail_core`

### ClickHouse
- `CLICKHOUSE_DB=analytics`
- `CLICKHOUSE_USER=default`
- `CLICKHOUSE_PASSWORD=` (пустой)

### Airflow
- `AIRFLOW__CORE__EXECUTOR=LocalExecutor`
- `AIRFLOW__CORE__LOAD_DEFAULT_CONNECTIONS=False`

### Superset
- `SUPERSET_CONFIG_PATH=/etc/superset/superset_config.py`
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin`

---

## Notes & Caveats

1. **Spark jobs** — директория `spark/jobs/` пуста, кластер готов к использованию
2. **Моковая аутентификация** — frontend использует localStorage, не production-ready
3. **LocalStack** — эмуляция S3, данные не сохраняются между перезапусками
4. **CSRF отключен** в Superset для development (не для production!)
5. **CORS origins: ['*']** — разрешены все источники (development only)
6. **Нет README.md** — этот QWEN.md заменяет документацию проекта
7. **Тесты** — только PostgreSQL, нет тестов для ClickHouse/Airflow/Frontend

---

## Frontend (React 19 + TypeScript + Vite 7) — DETAIL

### Build & Config

**Файлы конфигурации:**
| Файл | Назначение |
|------|------------|
| `front-end/package.json` | Зависимости, scripts (dev/build/preview) |
| `front-end/vite.config.ts` | Plugins: react, tailwindcss, viteSingleFile; alias `@/*` → `src/*` |
| `front-end/tsconfig.json` | TypeScript strict mode, path aliases |
| `front-end/Dockerfile` | Multi-stage: node:20-alpine (builder) → nginx:alpine (runner) |
| `front-end/nginx.conf` | Прокси `/api/`, `/superset/`, `/static/` → Superset; авто-логин через `sub_filter` |

**Зависимости:**
- `react` 19.2.3, `react-dom` 19.2.3
- `typescript` 5.9.3
- `vite` 7.2.4, `@vitejs/plugin-react` 5.1.1
- `tailwindcss` 4.1.17, `@tailwindcss/vite` 4.1.17
- `lucide-react` ^1.7.0 (иконки)
- `clsx` 2.1.1, `tailwind-merge` 3.4.0 (утилита `cn()`)
- `vite-plugin-singlefile` 2.3.0 (single-file build)

### Directory Structure (полная)

```
front-end/src/
├── App.tsx                          # Главный компонент: auth check → provider tree → AppContent
├── main.tsx                         # Точка входа: createRoot + StrictMode
├── index.css                        # Tailwind imports + глобальные стили
│
├── components/                      # 16 компонентов
│   ├── ui/                          # 11 переиспользуемых UI-примитивов
│   │   ├── index.ts                 # Ре-экспорт всех UI компонентов
│   │   ├── Button.tsx               # Кнопка (variants: primary/secondary/outline/ghost/danger)
│   │   ├── Card.tsx                 # Card + CardHeader/CardTitle/CardDescription/CardContent/CardFooter
│   │   ├── Input.tsx                # Поле ввода с label/error
│   │   ├── Badge.tsx                # Бейдж (variants: default/success/warning/error/info/purple)
│   │   ├── Select.tsx               # Выпадающий список
│   │   ├── Modal.tsx                # Модальное окно (overlay, close on ESC)
│   │   ├── Table.tsx                # Table/TableHeader/TableBody/TableRow/TableHead/TableCell/TableFooter
│   │   ├── Tabs.tsx                 # Tabs + TabPanel
│   │   ├── Toggle.tsx               # Toggle/switch
│   │   └── Tooltip.tsx              # Tooltip с position/delay
│   │
│   ├── Sidebar.tsx                  # Боковая навигация (8 пунктов, collapsible w-64→w-20)
│   ├── Header.tsx                   # Шапка: GlobalSearch + ThemeSwitcher + NotificationPanel + ProfileMenu
│   ├── GlobalSearch.tsx             # Полнотекстовый поиск (620 строк): fuzzy match, command mode (">"), recent searches, filters
│   ├── NotificationPanel.tsx        # Панель уведомлений (dropdown, filter all/unread)
│   ├── NotificationsFullModal.tsx   # Полноэкранная модалка уведомлений
│   ├── ProfileMenu.tsx              # Меню профиля (avatar, role badge, stats, settings links, logout)
│   ├── ThemeSwitcher.tsx            # Переключатель тем (light/dark/corporate/system)
│   ├── SupersetLoginGate.tsx        # Страница логина: POST /login/ с CSRF → /api/v1/me/ → role detection
│   ├── SupersetDashboard.tsx        # Iframe-встраивание Superset дашбордов (auto-auth через hidden iframe)
│   ├── PermissionGate.tsx           # RBAC-гейт: single permission / multiple (any/all), fallback, ProtectedPage
│   ├── SettingsModal.tsx            # Модалка настроек (7 tabs: profile/notifications/security/api/appearance/language/activity)
│   ├── HelpModal.tsx                # Справка (5 tabs: overview/guides/faq/shortcuts/support + ticket form)
│   ├── DashboardPlaceholder.tsx     # Заглушка загрузки дашборда
│   └── SystemAlerts.tsx             # Системные алерты
│
├── contexts/                        # 4 React Context
│   ├── AuthContext.tsx              # Моковая аутентификация (4 роли), localStorage('admin-user')
│   ├── ThemeContext.tsx             # Темы: light/dark/corporate/system, localStorage('admin-theme')
│   ├── LocalizationContext.tsx      # i18n: RU/EN + dateFormat + currency (RUB/USD/EUR) + firstDayOfWeek
│   └── NotificationContext.tsx      # Уведомления: CRUD operations, 5 initial mock notifications
│
├── pages/                           # 9 страниц
│   ├── OverviewPage.tsx             # Главная: Superset dashboardId="2" (iframe на весь экран)
│   ├── DashboardsPage.tsx           # Дашборды: fetch /api/v1/dashboard/ → dropdown selector → SupersetDashboard
│   ├── SalesPage.tsx                # Продажи: dateRange (week/month/quarter/year) + refresh + export + Superset iframe
│   ├── ProductsPage.tsx             # Товары: 8 mock products, grid/list view, search, category filter, PermissionGate
│   ├── AnalyticsPage.tsx            # Аналитика: dateRange + refresh + export + Superset iframe
│   ├── ReportsPage.tsx              # Отчёты: 6 mock reports, type filter, status badges, create modal
│   ├── UsersPage.tsx                # Пользователи: 6 mock users, search, card grid, context menu (edit/role/email/delete)
│   ├── SettingsPage.tsx             # Настройки: 8 sections (general/security/notifications/integrations/localization/email/api/roles)
│   └── PlaceholderPage.tsx          # Заглушка "в разработке" (Construction icon)
│
├── config/
│   └── permissions.ts               # RBAC: 22 permissions, 4 roles, hasPermission/hasAllPermissions/hasAnyPermission
│
├── hooks/                           # 7 кастомных хуков
│   ├── index.ts                     # Ре-экспорт всех хуков
│   ├── usePermissions.ts            # can/canAll/canAny + role checks (isAdmin/isAnalyst/isManager/isViewer)
│   ├── useLocalStorage.ts           # Generic localStorage hook с sync across tabs
│   ├── useSearch.ts                 # Fuzzy match scoring + highlightText + grouped results
│   ├── useProducts.ts               # Product filtering (search + category + viewMode + stats)
│   ├── useReports.ts                # Report filtering by type + stats + create modal state
│   ├── useSettings.ts               # Settings CRUD с localStorage persistence (25+ settings)
│   └── (missing: useCallback импорты в useProducts)
│
├── utils/                           # 5 утилит
│   ├── index.ts                     # Ре-экспорт: formatters, validators, constants, cn
│   ├── cn.ts                        # clsx + twMerge (Tailwind class dedup)
│   ├── formatters.ts                # formatNumber, formatCurrency, formatDate, formatTime, formatRelativeTime, formatFileSize, formatPercent, formatPhone
│   ├── validators.ts                # isValidEmail, isValidPassword, checkPasswordStrength, isValidPhone, isValidUrl, validate()
│   ├── constants.ts                 # USER_ROLES, ORDER_STATUS, PRODUCT_STATUS, REPORT_STATUS, API_ENDPOINTS, LIMITS, STORAGE_KEYS
│   └── (missing: SearchResults type export)
│
├── types/
│   └── index.ts                     # 15 TypeScript интерфейсов: User, Product, Order, Report, Dashboard, Notification, SearchResult, Permission, Role, Settings, Integration, ApiKey + type aliases
│
├── data/
│   ├── index.ts                     # Ре-экспорт mock данных
│   ├── mockData.ts                  # users(4), products(8), orders(5), reports(6), dashboards(3), notifications(4), integrations(5), apiKeys(2), roles(4)
│   └── searchItems.ts               # 30+ search items (pages/users/orders/products/actions/settings/help) + popularSearches + searchFilters
│
└── locales/
    ├── ru.json                      # 481+ строк переводов (RU)
    └── en.json                      # 481+ строк переводов (EN)
```

### App.tsx — Architecture Flow

```
App()
├── isAuthenticated check:
│   ├── sessionStorage('superset_authenticated') === 'true'?
│   │   └── fetch('/api/v1/me/') → ok → authenticated
│   └── NOT authenticated → <SupersetLoginGate />
│
└── authenticated → Provider Tree:
    ├── <ThemeProvider>           # theme: light/dark/corporate/system
    ├── <LocalizationProvider>    # language: ru/en, currency, dateFormat
    ├── <NotificationProvider>    # 5 mock notifications
    ├── <AuthProvider>            # mock user from localStorage
    └── <AppContent />
        ├── <Sidebar />           # 8 nav items, RBAC-aware (locked items shown)
        ├── <Header />
        │   ├── <GlobalSearch />  # Cmd+K, fuzzy search, command mode
        │   ├── <ThemeSwitcher />
        │   ├── <NotificationPanel />
        │   └── <ProfileMenu />
        ├── <main>                # activePage switch → render page
        ├── <HelpModal />         # 5 tabs
        └── <SettingsModal />     # 7 tabs
```

### Authentication Flow (двухуровневая)

**Уровень 1 — Superset Login:**
1. `SupersetLoginGate.tsx` показывает форму логина
2. GET `/login/` → извлекает CSRF token из HTML
3. POST `/login/` с username/password/csrf_token
4. GET `/api/v1/me/` → получает данные пользователя
5. **Проверка безопасности:** если сервер вернул username ≠ введённый → reject (старая сессия)
6. **Role detection:** Superset roles → app role mapping:
   - `admin` / username=`admin` → `admin`
   - `alpha` / `sql_lab` / `bi developer` / `data analyst` → `analyst`
   - `gamma` / `sql developer` → `manager`
   - fallback → `spectator`
7. Сохраняет в `localStorage('admin-user')` + `sessionStorage('superset_authenticated')`

**Уровень 2 — App Auth:**
- `AuthContext` читает `localStorage('admin-user')` при инициализации
- `login(role)` → загружает mock user из `mockUsers`
- `logout()` → clears localStorage

### Superset Integration

**Nginx proxy (nginx.conf):**
```
location /superset/ → proxy_pass http://superset:8088/
location /api/ → proxy_pass http://superset:8088/api/
location /static/ → proxy_pass http://superset:8088/static/
```
- `sub_filter` автоматически вставляет credentials в login form
- Hidden iframe на каждой странице загружает `/superset-login.html` для cookie auth

**SupersetDashboard.tsx:**
1. Hidden iframe → `/superset-login.html` (auto-auth)
2. Через 2 сек → visible iframe → `/superset/dashboard/{id}/?standalone=1&show_filters=true`
3. Loading spinner + error handling

### Global Search (GlobalSearch.tsx — 620 строк)

**Фичи:**
- **Hotkey:** `Ctrl+K` / `Cmd+K` — открыть, `Esc` — закрыть, `Tab` — command mode
- **Command mode:** ввод `>` → команды (тема, язык, настройки, logout)
- **Fuzzy match:** scoring system (exact=100, start=90, contains=80, fuzzy=50-75)
- **Filters:** all/page/user/order/product/action/setting/help
- **Recent searches:** localStorage, top 5, clearable
- **Popular searches:** predefined per language
- **Quick actions:** 6 buttons (overview/dashboards/sales/products/users/settings)
- **Highlighting:** подсветка совпадений в результатах

### RBAC System

**22 Permissions:**
```
view_dashboard, view_dashboards, view_sales, view_products, view_analytics,
view_reports, view_users, view_settings, edit_products, edit_orders,
edit_users, edit_settings, export_data, create_reports, manage_promotions,
invite_users, view_financials, view_system_alerts, manage_system
```

**Role → Permissions Matrix:**
| Permission | admin | analyst | manager | spectator |
|-----------|-------|---------|---------|-----------|
| view_dashboard | ✅ | ✅ | ✅ | ✅ |
| view_dashboards | ✅ | ✅ | ✅ | ✅ |
| view_sales | ✅ | ✅ | ✅ | ✅ |
| view_products | ✅ | ✅ | ✅ | ✅ |
| view_analytics | ✅ | ✅ | ❌ | ❌ |
| view_reports | ✅ | ✅ | ✅ | ❌ |
| view_users | ✅ | ❌ | ❌ | ❌ |
| view_settings | ✅ | ❌ | ❌ | ❌ |
| edit_products | ✅ | ❌ | ✅ | ❌ |
| edit_orders | ✅ | ❌ | ✅ | ❌ |
| edit_users | ✅ | ❌ | ❌ | ❌ |
| edit_settings | ✅ | ❌ | ❌ | ❌ |
| export_data | ✅ | ✅ | ❌ | ❌ |
| create_reports | ✅ | ✅ | ❌ | ❌ |
| manage_promotions | ✅ | ❌ | ✅ | ❌ |
| invite_users | ✅ | ❌ | ❌ | ❌ |
| view_financials | ✅ | ✅ | ❌ | ❌ |
| view_system_alerts | ✅ | ❌ | ❌ | ❌ |
| manage_system | ✅ | ❌ | ❌ | ❌ |

**Sidebar behavior:** Недоступные пункты показаны с иконкой 🔒 (Lock), не скрываются.

### Localization Context

**4 настраиваемых параметра:**
1. `language`: `'ru'` | `'en'` (localStorage: `app_language`)
2. `dateFormat`: `'DD.MM.YYYY'` | `'MM/DD/YYYY'` | `'YYYY-MM-DD'` (localStorage: `app_dateFormat`)
3. `currency`: `'RUB'` | `'USD'` | `'EUR'` (localStorage: `app_currency`)
4. `firstDayOfWeek`: `'monday'` | `'sunday'` (localStorage: `app_firstDayOfWeek`)

**Функции форматирования:**
- `t(key, params?)` — перевод с nested keys и interpolation `{param}`
- `formatDate(date)` — по выбранному формату
- `formatCurrency(amount)` — с учётом валюты (₽/$/€, разделители)
- `formatNumber(num)` — thousands separator
- `getWeekDays()` — дни недели с учётом firstDayOfWeek

**Fallback:** если ключ не найден в RU → ищет в EN → возвращает key

### Theme Context

**4 режима:**
- `light` — стандартная светлая тема
- `dark` — тёмная тема
- `corporate` — синяя бизнес-тема (slate палитра)
- `system` — следует `prefers-color-scheme` ОС

**Реализация:** CSS classes на `<html>` → Tailwind variants `dark:` и `corporate:`

### Page Details

**OverviewPage** — Superset dashboard #2 (iframe 100%)
**DashboardsPage** — fetch `/api/v1/dashboard/` → dropdown → SupersetDashboard
**SalesPage** — dateRange toggle + refresh + export (PermissionGate) + Superset iframe
**ProductsPage** — 8 mock products, grid/list toggle, search, category filter, PermissionGate для edit
**AnalyticsPage** — dateRange (day/week/month/year) + refresh + export + Superset iframe
**ReportsPage** — 6 mock reports, type filter, status badges (completed/processing/failed), create modal
**UsersPage** — 6 mock users, search, card grid, context menu (edit/role/email/delete)
**SettingsPage** — 8 sections, полная локализация, интеграционные карточки, toggle switches

### UI Components (components/ui/)

Все 11 компонентов экспортируются через `index.ts`:
- `Button` — variants: primary/secondary/outline/ghost/danger, sizes: sm/md/lg
- `Card` — составной: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `Input` — с label + error message
- `Badge` — variants: default/success/warning/error/info/purple
- `Select` — dropdown с label
- `Modal` — overlay, ESC close, click outside close
- `Table` — составной: Header/Body/Footer/Row/Head/Cell
- `Tabs` + `TabPanel` — tab navigation
- `Toggle` — on/off switch
- `Tooltip` — position (top/bottom/left/right), delay

### Hooks Detail

**usePermissions:**
```typescript
const { can, canAll, canAny, role, isAdmin, isAnalyst, isManager, isViewer } = usePermissions()
```

**useLocalStorage:**
```typescript
const [value, setValue] = useLocalStorage<T>(key, initialValue)
// Sync across tabs через custom event 'local-storage'
```

**useSearch:**
```typescript
const { results, groupedResults } = useSearch({ query, items, filter, language, limit })
// fuzzyMatch() + highlightText() exported standalone
```

**useProducts:**
```typescript
const { filteredProducts, stats, categories, setSearch, setCategory, setView } = useProducts({ products, categories })
```

**useReports:**
```typescript
const { filteredReports, selectedType, showCreateModal, stats, setReportType, createReport, closeCreateModal } = useReports({ reports })
```

**useSettings:**
```typescript
const { settings, updateSetting, updateSettings, resetSettings } = useSettings()
// 25+ settings persisted to localStorage('app_settings')
```

### Mock Data Summary

| Entity | Count | File |
|--------|-------|------|
| Users | 4 | `data/mockData.ts` |
| Products | 8 | `data/mockData.ts` |
| Orders | 5 | `data/mockData.ts` |
| Reports | 6 | `data/mockData.ts` |
| Dashboards | 3 | `data/mockData.ts` |
| Notifications | 4 | `data/mockData.ts` |
| Integrations | 5 | `data/mockData.ts` (Superset, Telegram, 1C, CDEK, ЮKassa) |
| API Keys | 2 | `data/mockData.ts` |
| Roles | 4 | `data/mockData.ts` |
| Search Items | 30+ | `data/searchItems.ts` |

### Nginx Config (front-end/nginx.conf)

Ключевые моменты:
- React SPA — root serve с `try_files $uri /index.html`
- `/superset/` → `http://superset:8088/` (proxy с sub_filter для авто-логина)
- `/api/` → `http://superset:8088/api/` (Superset REST API)
- `/static/` → `http://superset:8088/static/` (Superset static files)
- `sub_filter` вставляет скрытую форму авто-логина в Superset

### Known Issues / Notes

1. **useProducts.ts** — использует `useCallback` без импорта (нужно добавить `import { useCallback } from 'react'`)
2. **useReports.ts** — аналогично, `useCallback` без импорта
3. **Моковые данные** — все данные захардкожены, нет реального API backend
4. **Superset iframe** — 2-секундная задержка auth (хак через setTimeout, не надёжно)
5. **Нет React Router** — навигация через state (`activePage`), нет URL-based routing
6. **Нет тестов frontend** — только backend pg_tests
7. **SettingsPage.tsx** — 1187 строк, очень большой компонент (нужна декомпозиция)
8. **GlobalSearch.tsx** — 620 строк, сложная логика (нужна декомпозиция)

---

## Streaming Pipeline (Kafka + Flink)

### Architecture

```
PostgreSQL (CDC/Debezium) → Kafka Topics → Flink Jobs → ClickHouse
                                                    ↓
                                             Real-time Analytics
```

### Запуск

```bash
# Все streaming сервисы
docker compose -f docker-compose.streaming.yml up -d

# С Flink SQL Client (для разработки)
docker compose -f docker-compose.streaming.yml --profile tools up -d

# Остановка
docker compose -f docker-compose.streaming.yml down
docker compose -f docker-compose.streaming.yml down -v  # с удалением данных
```

### URLs

| Сервис | URL |
|--------|-----|
| Kafka UI | http://localhost:8090 |
| Flink Dashboard | http://localhost:8084 |

### Kafka Operations

```bash
# Список топиков
docker exec streaming-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Описать топик
docker exec streaming-kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic orders-events

# Просмотр сообщений
docker exec streaming-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic orders-events --from-beginning

# Отправка сообщений
docker exec streaming-kafka kafka-console-producer --bootstrap-server localhost:9092 --topic orders-events
```

### Flink Operations

```bash
# Submit job
docker exec streaming-flink-jobmanager flink run /opt/flink/usrlib/my-job.jar

# List jobs
docker exec streaming-flink-jobmanager flink list

# Cancel job
docker exec streaming-flink-jobmanager flink cancel <job-id>

# Savepoint
docker exec streaming-flink-jobmanager flink savepoint <job-id> /tmp/flink-savepoints
```

### Flink SQL Client

```bash
# Запуск
docker compose -f docker-compose.streaming.yml --profile tools up -d
docker exec -it streaming-flink-sql-client /opt/flink/bin/sql-client.sh

# Пример SQL
CREATE TABLE orders_source (...) WITH ('connector' = 'kafka', 'topic' = 'orders-events', ...);
SELECT * FROM orders_source;
```

### Mock Events Generator

```bash
pip install kafka-python
python flink/generate_mock_events.py
# Генерирует orders-events, user-activity, inventory-updates каждые 2 секунды
```

### Integration with Existing Pipeline

```
Batch:  PostgreSQL → Airflow → S3 (Parquet) → Spark → ClickHouse
Stream: PostgreSQL (CDC) → Kafka → Flink → ClickHouse
```

### Files

| Файл | Назначение |
|------|------------|
| `docker-compose.streaming.yml` | Kafka + Flink + Kafka UI |
| `flink/README.md` | Полная документация |
| `flink/jobs/orders-processing.sql` | Пример Flink SQL job |
| `flink/connectors/` | Кастомные коннекторы (Kafka, ClickHouse) |
| `flink/generate_mock_events.py` | Генератор тестовых данных |

---

## Output Language

**Default output language: Russian**
<!-- qwen-code:llm-output-language: Russian -->

Все ответы должны быть на русском языке. Технические артефакты (код, пути, логи) не переводятся.
