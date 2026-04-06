CREATE MATERIALIZED VIEW analytics.mv_new_vs_repeat
ENGINE = SummingMergeTree()
ORDER BY order_date
AS
SELECT
    o.order_date,
    countIf(prev_orders = 0) AS first_orders,
    countIf(prev_orders > 0) AS repeat_orders
FROM analytics.orders_facts AS o
LEFT JOIN (
    SELECT
        user_id,
        order_date,
        count() AS prev_orders
    FROM analytics.orders_facts
    GROUP BY user_id, order_date
) AS prev USING (user_id, order_date)
GROUP BY order_date;
