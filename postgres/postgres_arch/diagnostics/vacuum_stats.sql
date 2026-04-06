SELECT
    current_database() AS database,
    schemaname AS schema_name,
    relname AS table_name,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    vacuum_count AS manual_vacuum_count, -- manual
    autovacuum_count AS autovacuum_runs, -- auto
    last_vacuum AS last_manual_vacuum,
    last_autovacuum AS last_auto_vacuum,
    last_analyze AS last_manual_analyze,
    last_autoanalyze AS last_auto_analyze,
    ROUND(n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_percentage
FROM pg_stat_user_tables
ORDER BY dead_percentage DESC, n_dead_tup DESC
LIMIT 50;