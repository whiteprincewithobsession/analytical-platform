SELECT
    parent.relname         AS parent_table,
    child.relname          AS partition_name,
    nmsp_parent.nspname    AS parent_schema,
    nmsp_child.nspname     AS partition_schema,
    pg_size_pretty(pg_relation_size(child.oid)) AS partition_size,
    COALESCE(pg_stat_user_tables.n_live_tup, 0) AS live_tuples,
    COALESCE(pg_stat_user_tables.n_dead_tup, 0) AS dead_tuples,
    pg_stat_user_tables.last_vacuum,
    pg_stat_user_tables.last_autovacuum,
    pg_stat_user_tables.last_analyze,
    pg_stat_user_tables.last_autoanalyze
FROM pg_inherits
    JOIN pg_class parent        ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child         ON pg_inherits.inhrelid  = child.oid
    JOIN pg_namespace nmsp_parent ON parent.relnamespace = nmsp_parent.oid
    JOIN pg_namespace nmsp_child  ON child.relnamespace  = nmsp_child.oid
    LEFT JOIN pg_stat_user_tables ON child.relname = pg_stat_user_tables.relname
WHERE parent.relkind = 'p'
ORDER BY parent_table, partition_size DESC;