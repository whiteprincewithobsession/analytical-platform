CREATE MATERIALIZED VIEW analytics.mv_top_categories
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date, product_category)
AS
SELECT
    order_date,
    product_category,
    sum(total_amount) AS category_revenue,
    countDistinct(order_id) AS category_orders
FROM analytics.orders_facts
GROUP BY order_date, product_category;
