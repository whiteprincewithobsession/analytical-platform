SELECT
    NOW() AS check_time,
    pg_is_in_recovery() AS is_in_recovery,
    pg_postmaster_start_time() AS start_time,
    (SELECT COUNT(*) FROM pg_stat_activity) AS active_connections,
    (SELECT COUNT(*) FROM pg_locks WHERE NOT granted) AS waiting_locks,
    (SELECT SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) FROM pg_stat_activity) AS query_running,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle') AS idle_connections,
    ROUND(pg_database_size(current_database()) / 1024::numeric, 2) AS db_size_kilobytes;