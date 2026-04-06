SELECT
    'Database Cache Hit Ratio' AS metric_name,
    datname AS database_name,
    ROUND(
        100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2
    ) AS cache_hit_ratio_percent,
    blks_hit AS cache_hits,
    blks_read AS disk_reads,
    blks_hit + blks_read AS total_blocks
FROM pg_stat_database
WHERE datname = current_database()
  AND (blks_hit + blks_read) > 0;

SELECT
    'Table Cache Hit Ratio' AS metric_name,
    schemaname,
    relname AS table_name,
    CASE
        WHEN (heap_blks_hit + heap_blks_read) = 0 THEN NULL
        ELSE ROUND(
            100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2
        )
    END AS cache_hit_ratio_percent,
    heap_blks_hit AS cache_hits,
    heap_blks_read AS disk_reads,
    heap_blks_hit + heap_blks_read AS total_heap_blocks
FROM pg_statio_user_tables
WHERE (heap_blks_hit + heap_blks_read) > 0
ORDER BY cache_hit_ratio_percent ASC, total_heap_blocks DESC;

SELECT
    'Index Cache Hit Ratio' AS metric_name,
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    CASE
        WHEN (idx_blks_hit + idx_blks_read) = 0 THEN NULL
        ELSE ROUND(
            100.0 * idx_blks_hit / (idx_blks_hit + idx_blks_read), 2
        )
    END AS cache_hit_ratio_percent,
    idx_blks_hit AS cache_hits,
    idx_blks_read AS disk_reads,
    idx_blks_hit + idx_blks_read AS total_index_blocks
FROM pg_statio_user_indexes
WHERE (idx_blks_hit + idx_blks_read) > 0
ORDER BY cache_hit_ratio_percent ASC, total_index_blocks DESC;

SELECT
    'Overall User Tables Summary' AS metric_name,
    ROUND(
        100.0 * SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0), 2
    ) AS table_cache_hit_ratio_percent,
    ROUND(
        100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2
    ) AS index_cache_hit_ratio_percent,
    SUM(heap_blks_hit) AS total_table_cache_hits,
    SUM(heap_blks_read) AS total_table_disk_reads,
    SUM(idx_blks_hit) AS total_index_cache_hits,
    SUM(idx_blks_read) AS total_index_disk_reads
FROM pg_statio_user_tables;
