CREATE OR REPLACE VIEW analytics.customer_360_intelligence AS
WITH
base AS (
    SELECT * FROM analytics.customer_facts
),
total_revenue_per_user AS (
SELECT
    user_id,
    sum(category_revenue) AS total_revenue
FROM analytics.customer_preferences
GROUP BY user_id
),
preferences_detailed AS (
    SELECT
        cp.user_id,
        argMax(cp.product_category, cp.category_revenue) AS favorite_category,
        argMax(cp.product_brand, cp.category_revenue) AS favorite_brand,
        groupArray(5)((cp.category_revenue, cp.product_category, cp.category_orders)) AS top_categories,
        uniq(cp.product_category) AS unique_categories_purchased,
        uniq(cp.product_brand) AS unique_brands_purchased,
        max(cp.category_revenue) AS top_category_revenue,
        sum(cp.category_revenue) AS total_categories_revenue,
        sum(pow(cp.category_revenue / tr.total_revenue, 2)) AS hhi_index
    FROM analytics.customer_preferences cp
    INNER JOIN total_revenue_per_user tr ON cp.user_id = tr.user_id
    GROUP BY cp.user_id
),
channels_detailed AS (
    SELECT
        user_id,
        argMax(payment_method, usage_count) AS favorite_payment,
        argMax(device_type, usage_count) AS favorite_device,
        groupUniqArray(payment_method) AS all_payment_methods,
        groupUniqArray(device_type) AS all_devices,
        max(last_used) AS last_payment_datetime,
        uniq(payment_method) AS payment_methods_count,
        uniq(device_type) AS devices_count,
        maxIf(usage_count, payment_method != '') AS favorite_payment_count,
        sum(usage_count) AS total_payment_usage
    FROM analytics.customer_channels
    GROUP BY user_id
),
loyalty_detailed AS (
    SELECT * FROM analytics.customer_loyalty
),
time_patterns AS (
    SELECT
        user_id,
        groupUniqArray(toDayOfWeek(order_date)) AS active_weekdays,
        argMax(toDayOfWeek(order_date), order_date) AS last_order_weekday,
        avg(toHour(order_datetime)) AS avg_purchase_hour,
        groupUniqArray(toQuarter(order_date)) AS active_quarters,
        count(DISTINCT toStartOfMonth(order_date)) AS active_months_count,
        arraySort(groupArray(order_date)) AS order_dates_sequence
FROM analytics.orders_facts
WHERE order_status = 'completed'
GROUP BY user_id
),
order_intervals AS (
    SELECT
        user_id,
        avg(interval_days) AS avg_days_between_orders,
        quantile(0.5)(interval_days) AS median_days_between_orders,
        stddevPop(interval_days) AS stddev_days_between_orders,
        min(interval_days) AS min_days_between_orders,
        max(interval_days) AS max_days_between_orders,

        if(
            avgIf(interval_days, rn <= 3) > avgIf(interval_days, rn > 3),
            'Increasing', 'Decreasing'
        ) AS interval_trend

    FROM (
        SELECT
            user_id,
            dateDiff('day', prev_date, order_date) AS interval_days,
            row_number() OVER (PARTITION BY user_id ORDER BY order_date DESC) AS rn
        FROM (
            SELECT
                user_id,
                order_date,
                lagInFrame(order_date, 1, order_date) OVER (PARTITION BY user_id ORDER BY order_date) AS prev_date
            FROM (
                SELECT DISTINCT user_id, order_date
                FROM analytics.orders_facts
                WHERE order_status = 'completed'
            )
        )
        WHERE prev_date != order_date
    )
    GROUP BY user_id
),
price_sensitivity AS (
    SELECT
        user_id,

        avg(discount_amount / nullIf(total_amount + discount_amount, 0) * 100) AS avg_discount_percent,

        countIf(discount_amount > 0) / count() AS discount_dependency_rate,

        max(discount_amount) AS max_discount_received,

        max(total_amount) AS max_order_value,
        min(total_amount) AS min_order_value,
        stddevPop(total_amount) AS order_value_volatility

    FROM analytics.orders_facts
    WHERE order_status = 'completed'
    GROUP BY user_id
),
customer_lifetime AS (
    SELECT
        user_id,
        dateDiff('month', min(order_date), max(order_date)) AS lifetime_months,
        count(DISTINCT toStartOfMonth(order_date)) AS active_months,
        dateDiff('month', min(order_date), max(order_date)) + 1 AS potential_months
    FROM analytics.orders_facts
    WHERE order_status = 'completed'
    GROUP BY user_id
)
SELECT
    b.user_id,
    today() AS snapshot_date,
    now() AS calculated_at,

    b.first_order_date AS registration_date,
    toUInt32(dateDiff('day', b.first_order_date, today())) AS days_since_registration,
    b.first_order_date,
    b.last_order_date,
    dateDiff('day', b.first_order_date, today()) AS customer_age_days,

    toUInt32(abs(dateDiff('day', b.last_order_date, today()))) AS recency_days,
    b.total_orders AS frequency,
    b.total_revenue AS monetary,

    toUInt8(
        if(dateDiff('day', b.last_order_date, today()) <= 30, 5,
        if(dateDiff('day', b.last_order_date, today()) <= 60, 4,
        if(dateDiff('day', b.last_order_date, today()) <= 90, 3,
        if(dateDiff('day', b.last_order_date, today()) <= 180, 2, 1))))
    ) AS r_score,

    toUInt8(
        if(b.total_orders >= 10, 5,
        if(b.total_orders >= 5, 4,
        if(b.total_orders >= 3, 3,
        if(b.total_orders >= 2, 2, 1))))
    ) AS f_score,

    toUInt8(
        if(b.total_revenue >= 10000, 5,
        if(b.total_revenue >= 5000, 4,
        if(b.total_revenue >= 2000, 3,
        if(b.total_revenue >= 500, 2, 1))))
    ) AS m_score,

    if(r_score >= 4 AND f_score >= 4 AND m_score >= 4, 'Champions',
    if(r_score >= 3 AND f_score >= 3 AND m_score >= 3, 'Loyal Customers',
    if(r_score >= 4 AND f_score <= 2 AND m_score >= 3, 'New Big Spenders',
    if(r_score >= 4 AND f_score <= 2, 'New Customers',
    if(r_score >= 3 AND f_score <= 2 AND m_score <= 2, 'Promising',
    if(r_score >= 2 AND f_score >= 3 AND m_score >= 3, 'Potential Loyalists',
    if(r_score <= 2 AND f_score >= 3, 'At Risk',
    if(r_score <= 2 AND f_score >= 4 AND m_score >= 4, 'Cant Lose Them',
    if(r_score <= 1 AND f_score <= 2, 'Lost', 'Need Attention'))))))))) AS rfm_segment,

    b.avg_order_value,
    b.median_order_value,
    b.total_items AS total_items_purchased,
    b.avg_items_per_order,

    ifNull(oi.avg_days_between_orders, 0) AS avg_days_between_orders,
    ifNull(oi.median_days_between_orders, 0) AS median_days_between_orders,
    ifNull(oi.stddev_days_between_orders, 0) AS stddev_days_between_orders,
    ifNull(oi.min_days_between_orders, 0) AS min_days_between_orders,
    ifNull(oi.max_days_between_orders, 0) AS max_days_between_orders,
    ifNull(oi.interval_trend, 'Unknown') AS purchase_interval_trend,

    if(oi.avg_days_between_orders > 0,
       oi.stddev_days_between_orders / oi.avg_days_between_orders,
       0) AS purchase_regularity_score,

    b.total_revenue AS lifetime_value,

    ifNull(cl.lifetime_months, 0) AS lifetime_months,
    ifNull(cl.active_months, 0) AS active_months_count,
    if(cl.potential_months > 0,
       cl.active_months / cl.potential_months,
       0) AS activity_rate,

    if(cl.active_months > 0,
       b.total_revenue / cl.active_months,
       0) AS avg_monthly_revenue,

    toUInt16(
        if(oi.avg_days_between_orders > 0,
           oi.avg_days_between_orders * (1 + (dateDiff('day', b.last_order_date, today()) / 100)),
           30)
    ) AS predicted_next_order_days,
    toFloat32(
        least(1.0,
            greatest(0.0,
                (dateDiff('day', b.last_order_date, today()) - ifNull(oi.avg_days_between_orders, 30)) /
                greatest(ifNull(oi.stddev_days_between_orders, 15), 1)
            ) / 3
        )
    ) AS churn_probability,
    toFloat32(
        if(dateDiff('day', b.last_order_date, today()) + 30 >= ifNull(oi.avg_days_between_orders, 30),
           1 - churn_probability,
           churn_probability / 2)
    ) AS purchase_probability_30d,
    toFloat32(
        (r_score * 0.25 +
         f_score * 0.35 +
         m_score * 0.25 +
         if(oi.stddev_days_between_orders > 0 AND oi.avg_days_between_orders > 0,
            (1 - least(1, oi.stddev_days_between_orders / oi.avg_days_between_orders)) * 5,
            2.5) * 0.15
        ) * 20
    ) AS customer_health_score,
    toFloat32(
        (b.total_orders / greatest(dateDiff('month', b.first_order_date, today()), 1)) * 10
    ) AS engagement_index,

    formatDateTime(b.first_order_date, '%Y-%m') AS cohort_month,
    toUInt16(dateDiff('month', b.first_order_date, today())) AS months_since_first_order,
    toUInt32(0) AS cohort_size,

    ifNull(pd.favorite_category, '') AS favorite_category,
    ifNull(pd.favorite_brand, '') AS favorite_brand,
    ifNull(pd.top_categories, []) AS top_categories,

    ifNull(pd.unique_categories_purchased, 0) AS unique_categories_count,
    ifNull(pd.unique_brands_purchased, 0) AS unique_brands_count,

    ifNull(pd.hhi_index, 0) AS category_concentration_index,

    if(pd.total_categories_revenue > 0,
       pd.top_category_revenue / pd.total_categories_revenue,
       0) AS favorite_category_share,

    ifNull(ld.current_loyalty_level, '') AS current_loyalty_level,
    toUInt8(0) AS loyalty_level_rank,
    ifNull(ld.total_loyalty_discount, 0) AS total_loyalty_discount,
    ifNull(ld.loyalty_orders_count, 0) AS loyalty_orders_count,

    if(b.total_orders > 0,
       ld.loyalty_orders_count / b.total_orders * 100,
       0) AS loyalty_participation_rate,

    b.total_discount AS total_promo_discount,
    ifNull(ld.promo_orders_count, 0) AS promo_orders_count,

    if(b.total_orders > 0,
       ld.promo_orders_count / b.total_orders * 100,
       0) AS promo_usage_rate,

    ifNull(ld.unique_promos_used, 0) AS unique_promos_used,
    ifNull(ld.last_promo_code, '') AS last_promo_code,

    ifNull(ps.avg_discount_percent, 0) AS avg_discount_percent,
    ifNull(ps.discount_dependency_rate, 0) AS discount_dependency_rate,
    ifNull(ps.max_discount_received, 0) AS max_discount_received,

    if(ps.discount_dependency_rate > 0.7, 'High',
    if(ps.discount_dependency_rate > 0.3, 'Medium', 'Low')) AS price_sensitivity_level,

    ifNull(cd.favorite_payment, '') AS favorite_payment_method,
    ifNull(cd.favorite_device, '') AS most_used_device,
    ifNull(cd.all_payment_methods, []) AS payment_methods_used,
    ifNull(cd.all_devices, []) AS devices_used,

    ifNull(cd.payment_methods_count, 0) AS payment_diversity_score,
    ifNull(cd.devices_count, 0) AS device_diversity_score,

    if(cd.devices_count >= 3, 'Omnichannel',
    if(cd.devices_count >= 2, 'Multi-channel', 'Single-channel')) AS channel_behavior,

    ifNull(tp.active_weekdays, []) AS active_weekdays,
    ifNull(tp.last_order_weekday, 0) AS last_order_weekday,
    ifNull(tp.avg_purchase_hour, 0) AS avg_purchase_hour,

    if(tp.avg_purchase_hour >= 9 AND tp.avg_purchase_hour <= 17, 'Business Hours',
    if(tp.avg_purchase_hour >= 18 AND tp.avg_purchase_hour <= 22, 'Evening',
    if(tp.avg_purchase_hour >= 0 AND tp.avg_purchase_hour <= 6, 'Night', 'Morning'))) AS purchase_time_pattern,

    ifNull(tp.active_quarters, []) AS active_quarters,
    ifNull(tp.active_months_count, 0) AS total_active_months,

    toUInt32(dateDiff('day', b.last_order_date, today())) AS last_activity_days,
    toUInt8(if(dateDiff('day', b.last_order_date, today()) <= 30, 1, 0)) AS is_active_30d,
    toUInt8(if(dateDiff('day', b.last_order_date, today()) <= 90, 1, 0)) AS is_active_90d,

    if(b.total_orders >= 3 AND dateDiff('day', b.last_order_date, today()) <= 30, 'Growing',
    if(dateDiff('day', b.last_order_date, today()) <= 60, 'Stable',
    if(dateDiff('day', b.last_order_date, today()) <= 120, 'Declining', 'Churned'))) AS engagement_trend,

    if(churn_probability > 0.7, 'High Risk',
    if(churn_probability > 0.4, 'Medium Risk', 'Low Risk')) AS churn_risk_segment,

    if(rfm_segment IN ('Champions', 'Loyal Customers') AND churn_probability < 0.3, 'VIP',
    if(rfm_segment = 'New Customers' AND m_score >= 4, 'High Potential',
    if(rfm_segment IN ('At Risk', 'Cant Lose Them'), 'Needs Attention',
    if(rfm_segment = 'Lost', 'Win-Back Target', 'Regular')))) AS customer_type

FROM base b
LEFT JOIN preferences_detailed pd ON b.user_id = pd.user_id
LEFT JOIN channels_detailed cd ON b.user_id = cd.user_id
LEFT JOIN loyalty_detailed ld ON b.user_id = ld.user_id
LEFT JOIN time_patterns tp ON b.user_id = tp.user_id
LEFT JOIN order_intervals oi ON b.user_id = oi.user_id
LEFT JOIN price_sensitivity ps ON b.user_id = ps.user_id
LEFT JOIN customer_lifetime cl ON b.user_id = cl.user_id;