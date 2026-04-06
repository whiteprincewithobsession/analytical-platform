CREATE MATERIALIZED VIEW analytics.mv_active_customers_30d
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (snapshot_date)
AS
SELECT
    snapshot_date,
    countIf(is_active_30d = 1) AS active_customers_30d,
    countIf(is_active_90d = 1) AS active_customers_90d
FROM analytics.customer_metrics
GROUP BY snapshot_date;
