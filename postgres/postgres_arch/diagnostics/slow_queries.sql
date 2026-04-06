SELECT
    query,
    calls,
    total_exec_time AS total_time_ms,
    ROUND((total_exec_time / NULLIF(calls, 0))::numeric, 2) AS avg_time_ms,
    min_exec_time AS min_time_ms,
    max_exec_time AS max_time_ms,
    rows AS total_rows,
    shared_blks_hit + shared_blks_read AS total_blocks,
    ROUND((100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0))::numeric, 2) AS cache_hit_ratio,
    userid,
    dbid
FROM pg_stat_statements
WHERE calls > 0
ORDER BY avg_time_ms DESC
LIMIT 30;
