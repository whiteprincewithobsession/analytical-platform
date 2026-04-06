CREATE TABLE analytics.customer_facts
(
    user_id UInt64,
    first_order_date Date,
    last_order_date Date,
    total_orders UInt32,
    total_items UInt32,
    total_revenue Decimal(14, 2),
    total_discount Decimal(14, 2),
    avg_order_value Decimal(12, 2),
    median_order_value Decimal(12, 2),
    avg_items_per_order Float32,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY user_id;