-- ============================================================
-- ClickHouse DDL — Аналитическое хранилище (stage 2)
-- Движок: ReplacingMergeTree(id) — идемпотентность дедубликации
-- Копия из clickhouse/clickhouse_arch/tables/ для Spark volume
-- ============================================================

-- 1. Пользователи и профиль
CREATE TABLE IF NOT EXISTS analytics.users
(
    id UInt64,
    email String,
    phone Nullable(String),
    registered_at DateTime,
    last_login Nullable(DateTime),
    is_active Bool,
    is_confirmed Bool,
    first_name Nullable(String),
    last_name Nullable(String),
    birthday Nullable(Date),
    gender Nullable(String),
    preferred_locale LowCardinality(String),
    timezone LowCardinality(String),
    loyalty_level_name LowCardinality(String),
    region_name Nullable(String),
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (id, snapshot_date)
TTL snapshot_date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- 2. Товары (полная + денормализация категорий/брендов)
CREATE TABLE IF NOT EXISTS analytics.products
(
    id UInt32,
    code String,
    name String,
    description Nullable(String),
    brand_name Nullable(String),
    category_path String,
    category_id UInt32,
    price Decimal(12, 2),
    cost Nullable(Decimal(12, 2)),
    sku String,
    active Bool,
    created_at DateTime,
    updated_at DateTime,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (id, snapshot_date)
TTL snapshot_date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- 3. Заказы (flat: orders + order_items денормализованы)
CREATE TABLE IF NOT EXISTS analytics.orders_flat
(
    order_id UInt64,
    user_id UInt64,
    order_date Date,
    created_at DateTime,
    updated_at DateTime,
    status LowCardinality(String),
    total_amount Decimal(12, 2),
    payment_status LowCardinality(String),
    payment_method LowCardinality(String),
    delivery_type LowCardinality(String),
    country LowCardinality(String),
    city LowCardinality(String),
    currency_code LowCardinality(String),
    currency_rate_at_order Nullable(Decimal(16, 8)),
    loyalty_level_name LowCardinality(String),
    promo_code Nullable(String),
    discount_amount Decimal(12, 2),
    source_channel LowCardinality(String),
    device_type LowCardinality(String),
    order_item_id UInt32,
    product_id UInt32,
    product_name String,
    product_category LowCardinality(String),
    product_brand LowCardinality(String),
    quantity UInt32,
    item_price Decimal(12, 2),
    item_discount Decimal(12, 2),
    item_total Decimal(12, 2),
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, user_id, order_id, order_item_id, snapshot_date)
TTL order_date + INTERVAL 730 DAY
SETTINGS index_granularity = 8192;

-- 4. Корзины
CREATE TABLE IF NOT EXISTS analytics.carts
(
    cart_id UInt32,
    user_id UInt64,
    session_id Nullable(String),
    total_items UInt32,
    total_price Decimal(12, 2),
    created_at DateTime,
    updated_at DateTime,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (cart_id, snapshot_date)
TTL snapshot_date + INTERVAL 180 DAY
SETTINGS index_granularity = 8192;

-- 5. Элементы корзин
CREATE TABLE IF NOT EXISTS analytics.cart_items
(
    id UInt32,
    cart_id UInt32,
    product_id UInt32,
    product_name String,
    quantity UInt32,
    price Decimal(12, 2),
    created_at DateTime,
    updated_at DateTime,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (id, snapshot_date)
TTL snapshot_date + INTERVAL 180 DAY
SETTINGS index_granularity = 8192;

-- 6. Остатки на складах
CREATE TABLE IF NOT EXISTS analytics.inventory
(
    id UInt64,
    warehouse_id UInt32,
    warehouse_name String,
    warehouse_city LowCardinality(String),
    product_id UInt32,
    product_name String,
    quantity_available Decimal(12, 3),
    quantity_reserved Decimal(12, 3),
    min_stock_level Nullable(Decimal(12, 3)),
    reorder_point Nullable(Decimal(12, 3)),
    last_restock_date Nullable(Date),
    updated_at DateTime,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (id, snapshot_date)
TTL snapshot_date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- 7. Отзывы
CREATE TABLE IF NOT EXISTS analytics.reviews
(
    id UInt32,
    user_id UInt64,
    product_id UInt32,
    product_name String,
    order_id UInt64,
    rating UInt8,
    title Nullable(String),
    content String,
    verified_purchase Bool,
    moderation_status LowCardinality(String),
    visible Bool,
    created_at DateTime,
    updated_at DateTime,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (id, snapshot_date)
TTL created_at + INTERVAL 730 DAY
SETTINGS index_granularity = 8192;

-- 8. Промо-акции
CREATE TABLE IF NOT EXISTS analytics.promotions
(
    id UInt32,
    code String,
    name String,
    description Nullable(String),
    active Bool,
    type LowCardinality(String),
    discount_type Nullable(String),
    discount_value Nullable(Decimal(12, 2)),
    start_date DateTime,
    end_date DateTime,
    usage_limit Nullable(UInt32),
    per_user_limit Nullable(UInt32),
    min_purchase Nullable(Decimal(12, 2)),
    stackable Bool,
    created_at DateTime,
    updated_at DateTime,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (id, snapshot_date)
TTL snapshot_date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- 9. Программа лояльности — уровни
CREATE TABLE IF NOT EXISTS analytics.loyalty_levels
(
    id UInt32,
    program_name String,
    level_name String,
    level_rank UInt32,
    min_total_amount Decimal(14, 2),
    min_orders_count UInt32,
    discount_percent Decimal(4, 2),
    cashback_percent Decimal(4, 2),
    description Nullable(String),
    is_active Bool,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (id, snapshot_date)
TTL snapshot_date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- 10. История статусов заказов
CREATE TABLE IF NOT EXISTS analytics.order_status_history
(
    id UInt32,
    order_id UInt64,
    old_status Nullable(String),
    new_status LowCardinality(String),
    changed_by Nullable(UInt64),
    change_source Nullable(String),
    change_time DateTime,
    snapshot_date Date DEFAULT today()
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(change_time)
ORDER BY (order_id, change_time, id, snapshot_date)
TTL change_time + INTERVAL 730 DAY
SETTINGS index_granularity = 8192;

-- 11. Активность пользователей
CREATE TABLE IF NOT EXISTS analytics.user_activity
(
    id UInt64,
    user_id Nullable(UInt64),
    device_type LowCardinality(String),
    activity_time DateTime,
    activity_type LowCardinality(String),
    ip_address Nullable(String),
    session_id Nullable(String),
    snapshot_date Date DEFAULT today()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(activity_time)
ORDER BY (activity_time, id)
TTL activity_time + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;
