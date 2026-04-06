CREATE MATERIALIZED VIEW analytics.mv_loyalty_promo
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(order_date)
ORDER BY (order_date)
AS
SELECT
    order_date,
    countIf(loyalty_level != '') AS loyalty_orders,
    countIf(promo_code != '') AS promo_orders,
    sumIf(total_amount, promo_code != '') AS revenue_with_promo,
    sumIf(total_amount, loyalty_level != '') AS revenue_with_loyalty
FROM analytics.orders_facts
GROUP BY order_date;
