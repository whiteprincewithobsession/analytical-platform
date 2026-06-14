-- ============================================================
-- Product Views Streaming Pipeline — ClickHouse Setup
-- ============================================================
-- Данные: Flink (datagen 5 events/sec) → TUMBLE(10s) → Kafka: product-views-aggregated
-- Эта скрипт создаёт:
--   1. Целевую MergeTree таблицу: product_views_streaming
--   2. Kafka Engine таблицу: kafka_product_views_queue
--   3. Materialized View: mv_kafka_to_product_views
-- ============================================================

USE analytics;

-- 1. Целевая таблица (MergeTree)
DROP TABLE IF EXISTS product_views_streaming;

CREATE TABLE product_views_streaming
(
    window_start       DateTime,
    window_end         DateTime,
    total_views        UInt64,
    unique_users       UInt64,
    avg_session_duration Float64,
    avg_scroll_depth   Float64,
    ingested_at        DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (window_start, window_end);

-- 2. Kafka Engine таблица (consumer)
-- Важно: kafka_group_name должен быть уникальным при каждом пересоздании
DROP TABLE IF EXISTS kafka_product_views_queue;

CREATE TABLE kafka_product_views_queue
(
    window_start       String,
    window_end         String,
    total_views        UInt64,
    unique_users       UInt64,
    avg_session_duration Float64,
    avg_scroll_depth   Float64
)
ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'kafka:9092',
    kafka_topic_list = 'product-views-aggregated',
    kafka_group_name = 'clickhouse-product-views-v1',
    kafka_format = 'JSONEachRow',
    kafka_skip_broken_messages = 10;

-- 3. Materialized View — трансформация из Kafka queue в целевую таблицу
-- Flink пишет timestamps как строки "2026-06-14 12:00:00.000" → парсим до DateTime
DROP TABLE IF EXISTS mv_kafka_to_product_views;

CREATE MATERIALIZED VIEW mv_kafka_to_product_views
TO product_views_streaming
AS
SELECT
    toDateTime(substring(window_start, 1, 19)) AS window_start,
    toDateTime(substring(window_end, 1, 19)) AS window_end,
    total_views,
    unique_users,
    avg_session_duration,
    avg_scroll_depth
FROM kafka_product_views_queue;

-- ============================================================
-- Проверка
-- ============================================================
-- SELECT * FROM product_views_streaming ORDER BY window_start DESC LIMIT 10;
-- SELECT COUNT() FROM product_views_streaming;
