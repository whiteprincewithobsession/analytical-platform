CREATE MATERIALIZED VIEW analytics.mv_order_funnel
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, order_status)
AS
SELECT
    order_date,
    order_status,
    countDistinct(order_id) AS orders_in_status,
    sum(total_amount) AS revenue_in_status
FROM analytics.orders_facts
GROUP BY order_date, order_status;
