-- Query Stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text scan (for product catalog)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Encrypt passwords
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Compression and partitioning
CREATE EXTENSION IF NOT EXISTS pg_partman;
-- Need to reinstall cause of its not default extension

-- core.addresses -> geography for longitude and latitude
CREATE EXTENSION postgis;
