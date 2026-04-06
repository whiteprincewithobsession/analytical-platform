SELECT
    s.schemaname AS schema_name,
    s.relname AS table_name,
    s.indexrelname AS index_name,
    s.idx_scan AS index_scans,
    s.idx_tup_read AS tuples_read,
    s.idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
    i.indisunique AS is_unique,
    i.indisprimary AS is_primary
FROM pg_stat_user_indexes s
JOIN pg_index i ON s.indexrelid = i.indexrelid
WHERE s.schemaname NOT IN ('tiger', 'public', 'topology')
ORDER BY
    schema_name ASC,
    table_name ASC,
    index_size DESC;