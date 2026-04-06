CREATE TABLE analytics.customer_loyalty
(
    user_id UInt64,
    current_loyalty_level String,
    loyalty_orders_count UInt32,
    total_loyalty_discount Decimal(12, 2),
    promo_orders_count UInt32,
    total_promo_discount Decimal(12, 2),
    unique_promos_used UInt16,
    last_promo_code String,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY user_id;