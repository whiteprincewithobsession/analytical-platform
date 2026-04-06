SELECT name, setting, sourcefile, sourceline, error
FROM pg_file_settings
WHERE sourcefile IS NOT NULL
ORDER BY sourcefile, sourceline;

SELECT name, setting, source, sourcefile, sourceline
FROM pg_settings
ORDER BY sourcefile, sourceline;

SELECT name, setting, source FROM pg_settings;

SELECT name, context FROM pg_settings WHERE name = 'logging_collector';