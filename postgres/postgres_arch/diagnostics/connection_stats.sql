SELECT pid, usename, application_name, client_addr, state, query_start, state_change
FROM pg_stat_activity
ORDER BY state, query_start DESC;

WITH total_connections AS (
    SELECT COUNT(*) AS total
    FROM pg_stat_activity
),
active_connections AS (
    SELECT COUNT(*) AS active
    FROM pg_stat_activity
    WHERE state = 'active'
),
idle_connections AS (
    SELECT COUNT(*) AS idle
    FROM pg_stat_activity
    WHERE state = 'idle'
),
idle_in_transaction AS (
    SELECT COUNT(*) AS idle_tx
    FROM pg_stat_activity
    WHERE state = 'idle in transaction'
),
max_conn AS (
    SELECT setting::int AS max_connections
    FROM pg_settings
    WHERE name = 'max_connections'
)
SELECT
    t.total AS total_connections,
    a.active AS active_connections,
    i.idle AS idle_connections,
    tx.idle_tx AS idle_in_transaction,
    round(100.0 * t.total / m.max_connections, 2) AS used_pct
FROM total_connections t
CROSS JOIN active_connections a
CROSS JOIN idle_connections i
CROSS JOIN idle_in_transaction tx
CROSS JOIN max_conn m;