## Project Setup Notes

### 1. General Architecture Overview
- This project follows a strict modular structure by schema/domain (`core/`, `sales/`, `catalog/` etc.).
- Each domain has its own directory containing separate DDL files per table.
- Infrastructure and system scripts are placed in the `_ddl_init/`, `infra/`, and `_diagnostics/` directories.

### 2. Initialization Sequence (DDL)
1. `01_create_schemas.sql`: Creates schemas/namespaces for all business domains.
2. `02_create_roles.sql`: Defines all user/service/ops roles and grants.
3. `03_extensions.sql`: Installs required PostgreSQL extensions (uuid, trgm, etc).
4. Additional infra scripts (indexes, partitioning, triggers) must be run after all tables are created.

### 3. Environment and Docker Compose
- All persistent data is stored under `/var/lib/postgresql/data/pgdata` (mapped to `./pgdata`).
- Backup files are in `/backups` (`./backups` on host).
- WAL archives are in `/backup/wal` (`./wal` on host).
- Use `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` environment variables for database bootstrap.

### 4. Backup & Restore
- Use `infra/04_backup_restore.sh` for regular pg_dump backups and file rotations.
- Ensure backup/WAL directories are properly mounted in all environments.
- Restore process requires database and roles to be initialized prior to data import.

### 5. WAL and PITR Notes
- WAL archiving is enabled by default in `postgresql.conf`.
- Standard `archive_command` copies to `/backup/wal`—check volume mounting and disk space.
- For PITR, collect all backup and WAL files and use `pg_basebackup` (see script for basic workflow).

### 6. Security/Access
- Only app_admin and dba_admin roles have SUPERUSER rights.
- Default app/database users have NO DDL on production.
- Explicitly grant and restrict access using `GRANT`/`REVOKE` as per `02_create_roles.sql`.

### 7. Naming Conventions
- Schemas: all lowercase, singular (e.g., `core`, `sales`).
- Tables: singular, snake_case.
- Columns: snake_case; PKs are always `<table>_id`, FKs are `<ref>_id`.
- Indexes/partitions/triggers follow a dotted scheme: `<schema>.<table>_<type>.sql` or similar.

### 8. Extensions and Performance
- Use only reviewed and required extensions for your use case.
- Major indexes, partitioning, and vacuum policies should be regularly audited (see `_diagnostics/`).

### 9. Migration Policy
- All schema and DDL changes must be committed as separate files and referenced in changelogs.
- No direct DDL in production—use audited migrations.

### 10. Additional Notes
- Update all passwords and secrets before production use.
- Document any manual changes.
- Review this file after each significant infra or DDL refactoring.

---

**Last updated:** 2025-10-15
