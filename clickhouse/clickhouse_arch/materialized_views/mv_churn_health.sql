CREATE MATERIALIZED VIEW analytics.mv_churn_health
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY snapshot_date
AS
SELECT
    snapshot_date,
    avg(churn_probability) AS avg_churn_prob,
    avg(customer_health_score) AS avg_health_score
FROM analytics.customer_metrics
GROUP BY snapshot_date;
