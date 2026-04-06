CREATE TABLE analytics.customer_preferences
(
    user_id UInt64,
    product_category String,
    product_brand String,
    category_revenue Decimal(14, 2),
    category_orders UInt32,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (user_id , category_revenue);