-- change passwords ?
-- superuser only for critical operations
CREATE ROLE app_admin WITH LOGIN PASSWORD 'change_admin_pw' SUPERUSER;

-- back-end application
CREATE ROLE app_user WITH LOGIN PASSWORD 'change_app_pw' NOINHERIT;
GRANT CONNECT ON DATABASE omni_retail_core TO app_user;
GRANT USAGE ON SCHEMA core, catalog, sales, promo, cart, feedback, system TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core, catalog, sales, promo, cart, feedback, system TO app_user;

-- BI/ML/reports, select only
CREATE ROLE analytics_user WITH LOGIN PASSWORD 'change_analytics_pw' NOINHERIT;
GRANT CONNECT ON DATABASE omni_retail_core TO analytics_user;
GRANT USAGE ON SCHEMA core, catalog, sales, promo TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA core, catalog, sales, promo TO analytics_user;

-- select on everything, sometimes creating temporary tables
CREATE ROLE etl_user WITH LOGIN PASSWORD 'change_etl_pw' NOINHERIT;
GRANT CONNECT ON DATABASE omni_retail_core TO etl_user;
GRANT USAGE ON SCHEMA public, core, catalog, sales, promo, cart, system, feedback TO etl_user;
GRANT SELECT ON ALL TABLES IN SCHEMA core, catalog, sales, promo, cart, feedback, system TO etl_user;

-- select on system tables only for monitoring
CREATE ROLE monitoring_user WITH LOGIN PASSWORD 'change_monitoring_pw' NOINHERIT;
GRANT CONNECT ON DATABASE omni_retail_core TO monitoring_user;
GRANT SELECT ON system.error_logs, system.audit_logs TO monitoring_user;
GRANT SELECT ON pg_stat_user_tables, pg_stat_database TO monitoring_user;

-- insert into logs/audit only
CREATE ROLE audit_user WITH LOGIN PASSWORD 'change_audit_pw' NOINHERIT;
GRANT CONNECT ON DATABASE omni_retail_core TO audit_user;
GRANT INSERT ON system.audit_logs TO audit_user;

-- auto def perm
ALTER DEFAULT PRIVILEGES IN SCHEMA core, catalog, sales, promo, cart, feedback, system GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA core, catalog, sales, promo GRANT SELECT ON TABLES TO analytics_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA core, catalog, sales, promo, cart, feedback, system GRANT SELECT ON TABLES TO etl_user;

-- cant access to business data
CREATE ROLE devops_user WITH LOGIN PASSWORD 'change_devops_pw';
GRANT CONNECT ON DATABASE omni_retail_core TO devops_user;
GRANT USAGE ON SCHEMA public, core, catalog, sales, promo, cart, system, feedback TO devops_user;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA core, catalog, sales, promo, cart, feedback, system
TO devops_user;