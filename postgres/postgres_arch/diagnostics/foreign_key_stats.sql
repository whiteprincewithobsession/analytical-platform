SELECT
    conname AS constraint_name,
    conrelid::regclass AS source_table,
    a.attname AS source_column,
    confrelid::regclass AS target_table,
    af.attname AS target_column,
    c.confupdtype AS on_update,
    c.confdeltype AS on_delete
FROM pg_constraint c
JOIN pg_class cl ON c.conrelid = cl.oid
JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(c.conkey)
JOIN pg_class clf ON c.confrelid = clf.oid
JOIN pg_attribute af ON af.attrelid = clf.oid AND af.attnum = ANY(c.confkey)
WHERE c.contype = 'f'
ORDER BY source_table, constraint_name;