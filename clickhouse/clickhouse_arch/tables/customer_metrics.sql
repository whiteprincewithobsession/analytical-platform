CREATE TABLE analytics.customer_metrics
(
    user_id UInt64,
    snapshot_date Date,
    registration_date Date,
    days_since_registration UInt32,
    first_order_date Date,
    last_order_date Date,
    recency_days UInt32,
    frequency UInt32,
    monetary Decimal(14, 2),

    -- RFM 1-5
    r_score UInt8,
    f_score UInt8,
    m_score UInt8,
    rfm_segment LowCardinality(String),
    avg_order_value Decimal(12, 2),
    median_order_value Decimal(12, 2),
    avg_days_between_orders Float32,
    total_items_purchased UInt32,
    avg_items_per_order Float32,
    lifetime_value Decimal(14, 2),
    predicted_next_order_days UInt16,
    churn_probability Float32, -- 0-1
    customer_health_score Float32, -- 0-100

    cohort_month String,
    cohort_size UInt32,
    months_active UInt16,
    favorite_category LowCardinality(String),
    favorite_brand LowCardinality(String),
    favorite_payment_method LowCardinality(String),
    most_used_device LowCardinality(String),
    top_categories Array(Tuple(category String, revenue Decimal(12,2), orders UInt32)),
    current_loyalty_level LowCardinality(String),
    loyalty_level_rank UInt8,
    total_loyalty_discount Decimal(12, 2),
    loyalty_orders_count UInt32,
    loyalty_orders_percent Float32,
    total_promo_discount Decimal(12, 2),
    promo_orders_count UInt32,
    promo_usage_rate Float32,
    unique_promos_used UInt16,
    favorite_promo_code String,
    payment_methods_used Array(String),
    payment_diversity_score Float32,
    last_activity_days UInt32,
    is_active_30d UInt8,
    is_active_90d UInt8,
    engagement_trend LowCardinality(String),
    updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (snapshot_date, user_id)
SETTINGS index_granularity = 8192;