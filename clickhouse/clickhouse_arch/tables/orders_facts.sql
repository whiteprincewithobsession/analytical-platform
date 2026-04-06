CREATE TABLE analytics.orders_facts
(
    order_id UInt64,
    user_id UInt64,
    order_date Date,
    order_datetime DateTime,
    product_id UInt32,
    product_name String,
    product_category LowCardinality(String),
    product_brand LowCardinality(String),
    quantity UInt32,
    base_price Decimal(12, 2),
    discount_amount Decimal(12, 2),
    final_price Decimal(12, 2),
    total_amount Decimal(12, 2),
    promo_code String,
    loyalty_level LowCardinality(String),
    loyalty_discount_percent Decimal(4, 2),
    payment_method LowCardinality(String),
    payment_category LowCardinality(String),
    delivery_type LowCardinality(String),
    country LowCardinality(String),
    city LowCardinality(String),
    region LowCardinality(String),
    device_type LowCardinality(String),
    source_channel LowCardinality(String),
    order_status LowCardinality(String),
    payment_status LowCardinality(String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, user_id, order_id, product_id)
TTL order_date + INTERVAL 3 YEAR
SETTINGS index_granularity = 8192;

ALTER TABLE analytics.orders_facts
    ADD INDEX idx_user_id user_id TYPE minmax GRANULARITY 4,
    ADD INDEX idx_category product_category TYPE set(0) GRANULARITY 4,
    ADD INDEX idx_brand product_brand TYPE set(0) GRANULARITY 4;

