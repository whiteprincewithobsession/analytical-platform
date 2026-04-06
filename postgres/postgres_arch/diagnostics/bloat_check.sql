SELECT
    current_database() AS database,
    schemaname AS schema_name,
    relname AS table_name,
    pg_total_relation_size(relid) AS total_size_bytes,
    pg_relation_size(relid) AS data_size_bytes,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_tup_perc,
    (pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_and_bloat_bytes
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_tup_perc DESC, index_and_bloat_bytes DESC
LIMIT 30;

SELECT
    t.schemaname AS schema_name,
    t.relname AS table_name,
    i.indexrelname AS index_name,
    pg_relation_size(i.indexrelid) AS index_size_bytes,
    i.idx_scan AS index_scans
FROM pg_stat_user_indexes i
JOIN pg_stat_user_tables t ON i.relid = t.relid
WHERE t.schemaname NOT IN ('tiger', 'public', 'topology')
ORDER BY index_size_bytes DESC
LIMIT 30;
