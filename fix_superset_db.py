import sqlite3

db_path = r'd:\studying\diplom\superset_home\superset.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Сбрасываем зашифрованные поля
cursor.execute("UPDATE dbs SET encrypted_extra = NULL, password = NULL")

# Обновляем connection strings с правильными host (из docker-compose)
cursor.execute("""
    UPDATE dbs SET sqlalchemy_uri = 
    CASE id 
        WHEN 1 THEN 'clickhousedb://admin:admin@clickhouse:8123/analytics'
        WHEN 2 THEN 'postgresql+psycopg2://admin:admin@postgres:5432/omni_retail_core'
        WHEN 3 THEN 'postgresql+psycopg2://admin:admin@postgres:5432/omni_retail_core'
    END
""")

conn.commit()

# Проверяем
cursor.execute("SELECT id, database_name, sqlalchemy_uri, encrypted_extra, password FROM dbs")
rows = cursor.fetchall()
print(f"Updated {len(rows)} databases:")
for r in rows:
    print(f"  [{r[0]}] {r[1]}")
    print(f"       uri: {r[2]}")
    print(f"       encrypted_extra: {r[3]}")
    print(f"       password: {r[4]}")
    print()

# Также проверяем таблицы (datasets) - там тоже могут быть зашифрованные поля
cursor.execute("SELECT COUNT(*) FROM tables")
print(f"Tables (datasets): {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM slices")
print(f"Slices (charts): {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM dashboards")
print(f"Dashboards: {cursor.fetchone()[0]}")

conn.close()
print("\nDone! Restart Superset to apply changes.")
