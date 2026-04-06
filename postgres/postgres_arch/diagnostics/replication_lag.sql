-- useful only if replication is on-mode

-- only primary db
SELECT
    pid,
    usename AS replication_user,
    application_name AS replica_name,
    client_addr AS replica_ip,
    state,
    sync_state,
    write_lag,
    flush_lag,
    replay_lag,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS lag_bytes_diff,
    pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes_raw,
    ROUND(EXTRACT(EPOCH FROM COALESCE(replay_lag, interval '0'))) AS lag_seconds_approx
FROM pg_stat_replication
ORDER BY lag_bytes_raw DESC NULLS LAST;

-- standby query
SELECT
    pg_is_in_recovery() AS is_standby,
    pg_last_wal_receive_lsn() AS last_received_lsn,
    pg_last_wal_replay_lsn() AS last_replayed_lsn,
    pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() AS is_caught_up,
    now() - pg_last_xact_replay_timestamp() AS lag_interval,
    EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp())::numeric(10,2) AS lag_seconds
FROM pg_catalog.pg_last_xact_replay_timestamp() AS t;