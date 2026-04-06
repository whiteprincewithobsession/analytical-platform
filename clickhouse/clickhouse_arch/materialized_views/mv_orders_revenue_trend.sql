CREATE MATERIALIZED VIEW analytics.mv_orders_revenue_trend
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date)
AS
SELECT
    order_date,
    countDistinct(order_id) AS orders_count,
    sum(total_amount) AS total_revenue,
    countDistinct(user_id) AS unique_customers
FROM analytics.orders_facts
GROUP BY order_date;
