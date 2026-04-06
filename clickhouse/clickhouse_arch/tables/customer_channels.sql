CREATE TABLE analytics.customer_channels
(
    user_id UInt64,
    payment_method String,
    device_type String,
    usage_count UInt32,
    last_used DateTime,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (user_id, usage_count);