SELECT
    w.pid            AS waiting_pid,
    w.usename        AS waiting_user,
    w.application_name AS waiting_app,
    w.client_addr    AS waiting_client,
    w.state          AS waiting_state,
    w.query          AS waiting_query,
    w.query_start    AS waiting_query_start,
    l1.locktype      AS waiting_locktype,
    l1.mode          AS waiting_mode,

    b.pid            AS blocking_pid,
    b.usename        AS blocking_user,
    b.application_name AS blocking_app,
    b.client_addr    AS blocking_client,
    b.state          AS blocking_state,
    b.query          AS blocking_query,
    b.query_start    AS blocking_query_start,
    l2.locktype      AS blocking_locktype,
    l2.mode          AS blocking_mode,

    l1.relation::regclass AS locked_relation,
    l1.page, l1.tuple
FROM pg_locks l1
    JOIN pg_stat_activity w ON l1.pid = w.pid
    JOIN pg_locks l2 ON l1.locktype = l2.locktype
                  AND l1.database IS NOT DISTINCT FROM l2.database
                  AND l1.relation IS NOT DISTINCT FROM l2.relation
                  AND l1.page IS NOT DISTINCT FROM l2.page
                  AND l1.tuple IS NOT DISTINCT FROM l2.tuple
                  AND l1.transactionid IS NOT DISTINCT FROM l2.transactionid
                  AND l1.classid IS NOT DISTINCT FROM l2.classid
                  AND l1.objid IS NOT DISTINCT FROM l2.objid
                  AND l1.objsubid IS NOT DISTINCT FROM l2.objsubid
                  AND l1.pid <> l2.pid
    JOIN pg_stat_activity b ON l2.pid = b.pid
WHERE NOT l1.granted
  AND l2.granted
ORDER BY w.query_start;