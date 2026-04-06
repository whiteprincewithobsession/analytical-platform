SELECT relname AS table_name,
       100 * idx_scan / (seq_scan + idx_scan + 1) AS index_usage_pct,
       idx_scan, seq_scan
FROM pg_stat_user_tables
ORDER BY index_usage_pct ASC
LIMIT 20;

SELECT schemaname as schema_name,
       relname AS table_name,
       indexrelname AS index_name,
       idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 and schemaname NOT IN ('tiger', 'topology', 'public')
ORDER BY relname;