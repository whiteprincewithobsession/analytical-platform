SELECT
    schemaname as schema_name,
    relname AS table_name,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_tup_hot_upd AS hot_updates
FROM pg_stat_user_tables
WHERE schemaname NOT IN ('tiger', 'public', 'topology')
ORDER BY
    schema_name,
    (n_tup_ins + n_tup_upd + n_tup_del) DESC;