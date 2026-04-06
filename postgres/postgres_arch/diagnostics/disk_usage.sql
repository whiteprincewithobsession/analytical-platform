SELECT
    pg_database.datname AS database,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS db_size
FROM pg_database
WHERE datname = current_database();
