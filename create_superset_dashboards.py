"""
Создание дашбордов Superset через прямой SQL в PostgreSQL.
Обходит проблемы REST API с ClickHouse.
"""
import psycopg2
import requests
import json
import time
import uuid

DB_PARAMS = {
    "host": "localhost", "port": 5431,
    "database": "superset_meta",
    "user": "superset", "password": "superset_pass"
}

SUPERSET_URL = "http://localhost:8088"
session = requests.Session()

def login():
    r = session.post(f"{SUPERSET_URL}/api/v1/security/login",
        json={"username": "admin", "password": "admin", "provider": "db", "refresh": True})
    r.raise_for_status()
    session.headers.update({"Authorization": f"Bearer {r.json()['access_token']}"})
    print("[OK] Login")

def get_db_id():
    # Сначала проверяем в PostgreSQL
    try:
        pg_conn = psycopg2.connect(**DB_PARAMS)
        cur = pg_conn.cursor()
        cur.execute("SELECT id FROM dbs WHERE sqlalchemy_uri LIKE '%%clickhouse%%'")
        row = cur.fetchone()
        pg_conn.close()
        if row:
            print(f"[OK] ClickHouse DB exists in PG (id={row[0]})")
            return row[0]
    except:
        pass

    # Через API
    r = session.get(f"{SUPERSET_URL}/api/v1/database/")
    r.raise_for_status()
    for db in r.json().get("result", []):
        uri = db.get("sqlalchemy_uri", "").lower()
        name = db.get("database_name", "").lower()
        if "clickhouse" in uri or "clickhouse" in name:
            return db["id"]

    # Create via API
    print("[CREATE] Adding ClickHouse database...")
    r = session.post(f"{SUPERSET_URL}/api/v1/database/", json={
        "database_name": "ClickHouse Analytics",
        "sqlalchemy_uri": "clickhousedb://admin:admin@olap_retail:8123/analytics",
    })
    if r.status_code in (200, 201):
        db_id = r.json().get("id")
        if db_id:
            print(f"[OK] Created DB via API (id={db_id})")
            return db_id
    # Retry
    r2 = session.get(f"{SUPERSET_URL}/api/v1/database/")
    for db in r2.json().get("result", []):
        if db.get("database_name") == "ClickHouse Analytics":
            return db["id"]

    # Create directly in PostgreSQL
    print("[CREATE] Adding ClickHouse DB directly in PostgreSQL...")
    pg_conn = psycopg2.connect(**DB_PARAMS)
    cur = pg_conn.cursor()
    cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM dbs")
    db_id = cur.fetchone()[0]
    db_uuid = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO dbs (id, uuid, database_name, sqlalchemy_uri, created_on, changed_on)
        VALUES (%s, %s, %s, %s, NOW(), NOW())
    """, (db_id, db_uuid, "ClickHouse Analytics", "clickhousedb://admin:admin@olap_retail:8123/analytics"))
    pg_conn.commit()
    pg_conn.close()
    print(f"[OK] Created DB directly (id={db_id})")
    return db_id

# Схема колонок для каждой таблицы
TABLE_COLUMNS = {
    "orders_facts": [
        ("order_id", "BIGINT", True), ("user_id", "BIGINT", True),
        ("order_date", "DATETIME", True), ("order_datetime", "DATETIME", True),
        ("product_id", "INT", True), ("product_name", "STRING", True),
        ("product_category", "STRING", True), ("product_brand", "STRING", True),
        ("quantity", "BIGINT", True), ("base_price", "DECIMAL", True),
        ("discount_amount", "DECIMAL", True), ("final_price", "DECIMAL", True),
        ("total_amount", "DECIMAL", True), ("promo_code", "STRING", True),
        ("loyalty_level", "STRING", True), ("loyalty_discount_percent", "DECIMAL", True),
        ("payment_method", "STRING", True), ("payment_category", "STRING", True),
        ("delivery_type", "STRING", True), ("country", "STRING", True),
        ("city", "STRING", True), ("region", "STRING", True),
        ("device_type", "STRING", True), ("source_channel", "STRING", True),
        ("order_status", "STRING", True), ("payment_status", "STRING", True),
    ],
    "customer_metrics": [
        ("user_id", "BIGINT", True), ("snapshot_date", "DATETIME", True),
        ("registration_date", "DATETIME", True), ("days_since_registration", "BIGINT", True),
        ("first_order_date", "DATETIME", True), ("last_order_date", "DATETIME", True),
        ("recency_days", "BIGINT", True), ("frequency", "BIGINT", True),
        ("monetary", "DECIMAL", True), ("r_score", "BIGINT", True),
        ("f_score", "BIGINT", True), ("m_score", "BIGINT", True),
        ("rfm_segment", "STRING", True), ("avg_order_value", "DECIMAL", True),
        ("median_order_value", "DECIMAL", True), ("avg_days_between_orders", "FLOAT", True),
        ("total_items_purchased", "BIGINT", True), ("avg_items_per_order", "FLOAT", True),
        ("lifetime_value", "DECIMAL", True), ("predicted_next_order_days", "BIGINT", True),
        ("churn_probability", "FLOAT", True), ("customer_health_score", "FLOAT", True),
        ("cohort_month", "STRING", True), ("cohort_size", "BIGINT", True),
        ("months_active", "BIGINT", True), ("favorite_category", "STRING", True),
        ("favorite_brand", "STRING", True), ("favorite_payment_method", "STRING", True),
        ("most_used_device", "STRING", True), ("current_loyalty_level", "STRING", True),
        ("loyalty_level_rank", "BIGINT", True), ("total_loyalty_discount", "DECIMAL", True),
        ("loyalty_orders_count", "BIGINT", True), ("loyalty_orders_percent", "FLOAT", True),
        ("total_promo_discount", "DECIMAL", True), ("promo_orders_count", "BIGINT", True),
        ("promo_usage_rate", "FLOAT", True), ("unique_promos_used", "BIGINT", True),
        ("favorite_promo_code", "STRING", True), ("payment_diversity_score", "FLOAT", True),
        ("last_activity_days", "BIGINT", True), ("is_active_30d", "BIGINT", True),
        ("is_active_90d", "BIGINT", True), ("engagement_trend", "STRING", True),
    ],
    "customer_loyalty": [
        ("user_id", "BIGINT", True), ("current_loyalty_level", "STRING", True),
        ("loyalty_orders_count", "BIGINT", True), ("total_loyalty_discount", "DECIMAL", True),
        ("promo_orders_count", "BIGINT", True), ("total_promo_discount", "DECIMAL", True),
        ("unique_promos_used", "BIGINT", True), ("last_promo_code", "STRING", True),
    ],
    "mv_active_customers_30d": [
        ("snapshot_date", "DATETIME", True), ("active_customers_30d", "BIGINT", True),
        ("active_customers_90d", "BIGINT", True),
    ],
    "mv_churn_health": [
        ("snapshot_date", "DATETIME", True), ("avg_churn_prob", "FLOAT", True),
        ("avg_health_score", "FLOAT", True),
    ],
    "orders_realtime": [
        ("window_start", "DATETIME", True), ("window_end", "DATETIME", True),
        ("total_orders", "BIGINT", True), ("total_revenue", "FLOAT", True),
        ("avg_order_amount", "FLOAT", True), ("unique_users", "BIGINT", True),
    ],
    "user_activity": [
        ("id", "BIGINT", True), ("user_id", "BIGINT", False),
        ("device_type", "STRING", True), ("activity_time", "DATETIME", True),
        ("activity_type", "STRING", True), ("ip_address", "STRING", False),
        ("session_id", "STRING", False), ("snapshot_date", "DATETIME", True),
    ],
    "inventory": [
        ("id", "BIGINT", True), ("warehouse_id", "BIGINT", True),
        ("warehouse_name", "STRING", True), ("warehouse_city", "STRING", True),
        ("product_id", "BIGINT", True), ("product_name", "STRING", True),
        ("quantity_available", "DECIMAL", True), ("quantity_reserved", "DECIMAL", True),
        ("min_stock_level", "DECIMAL", False), ("reorder_point", "DECIMAL", False),
        ("last_restock_date", "DATETIME", False), ("snapshot_date", "DATETIME", True),
    ],
}


def create_dataset(conn, database_id, table_name, schema="analytics"):
    """Создаёт датасет и колонки напрямую в БД"""
    cur = conn.cursor()

    # Проверяем существует ли
    cur.execute("SELECT id FROM tables WHERE table_name = %s AND database_id = %s",
                (table_name, database_id))
    row = cur.fetchone()
    if row:
        ds_id = row[0]
        print(f"  [EXISTS] {table_name} (id={ds_id})")
        return ds_id

    # Создаём dataset
    cur.execute("SELECT nextval('tables_id_seq')")
    table_id = cur.fetchone()[0]

    table_uuid = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO tables (
            id, uuid, table_name, database_id, schema, created_on, changed_on,
            created_by_fk, changed_by_fk
        ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW(), 1, 1)
    """, (table_id, table_uuid, table_name, database_id, schema))

    # Создаём колонки
    columns = TABLE_COLUMNS.get(table_name, [])
    for col_name, col_type, is_dttm in columns:
        col_id = None
        try:
            cur.execute("SELECT nextval('table_columns_id_seq')")
            col_id = cur.fetchone()[0]
        except:
            cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM table_columns")
            col_id = cur.fetchone()[0] + 1

        cur.execute("""
            INSERT INTO table_columns (
                id, table_id, column_name, type, is_dttm, created_on, changed_on,
                created_by_fk, changed_by_fk
            ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW(), 1, 1)
        """, (col_id, table_id, col_name, col_type, is_dttm))

    conn.commit()
    print(f"  [OK] {table_name} (id={table_id}, {len(columns)} cols)")
    return table_id


def create_chart_api(ds_id, title, viz_type, metrics=None, groupby=None,
                     granularity=None, row_limit=10000, extra=None):
    params = {
        "datasource": f"{ds_id}__table",
        "viz_type": viz_type,
        "adhoc_filters": [],
        "row_limit": row_limit,
    }
    if metrics:
        params["metrics"] = metrics
    if groupby:
        params["groupby"] = groupby
    if granularity:
        params["granularity_sqla"] = granularity
        params["time_grain_sqla"] = "P1D"
    if extra:
        params.update(extra)

    ctx = {
        "datasource": {"id": ds_id, "type": "table"},
        "viz_type": viz_type,
        "adhoc_filters": [],
        "row_limit": row_limit,
    }
    if metrics:
        ctx["metrics"] = metrics
    if groupby:
        ctx["groupby"] = groupby
    if granularity:
        ctx["granularity_sqla"] = granularity

    r = session.post(f"{SUPERSET_URL}/api/v1/chart/", json={
        "slice_name": title,
        "viz_type": viz_type,
        "datasource_id": ds_id,
        "datasource_type": "table",
        "params": json.dumps(params),
        "query_context": json.dumps(ctx),
    })
    if r.status_code in (200, 201):
        cid = r.json().get("id")
        if cid:
            print(f"    [OK] '{title}' (id={cid})")
            return cid
    print(f"    [ERR] '{title}': {r.status_code} {r.text[:200]}")
    return None


def create_dashboard(title, charts_with_pos):
    r = session.post(f"{SUPERSET_URL}/api/v1/dashboard/", json={"dashboard_title": title})
    if r.status_code not in (200, 201):
        print(f"  [ERR] Create '{title}': {r.status_code}")
        return None
    dash_id = r.json()["id"]
    print(f"  [DASH] '{title}' (id={dash_id})")

    pos = {
        "DASHBOARD_VERSION_KEY": "v2",
        "ROOT_ID": {"children": ["GRID_ID"], "id": "ROOT_ID", "type": "ROOT"},
        "GRID_ID": {"children": [], "id": "GRID_ID", "type": "GRID", "parents": ["ROOT_ID"]},
        "HEADER_ID": {"id": "HEADER_ID", "type": "HEADER", "meta": {"text": title}},
    }
    for i, (cid, p) in enumerate(charts_with_pos):
        if cid is None:
            continue
        x, y, w, h = p
        ck = f"CHART-{cid}"
        tk = f"TAB-{i}"
        pos[ck] = {
            "id": ck, "type": "CHART",
            "meta": {"chartId": cid, "height": h * 25, "width": w},
            "children": [], "parents": ["ROOT_ID", "GRID_ID", tk],
        }
        pos[tk] = {
            "id": tk, "type": "TABS", "meta": {},
            "children": [ck], "parents": ["ROOT_ID", "GRID_ID"],
        }
        pos["GRID_ID"]["children"].append(tk)

    r = session.put(f"{SUPERSET_URL}/api/v1/dashboard/{dash_id}",
        json={"position_json": json.dumps(pos)})
    if r.status_code in (200, 201):
        print(f"  [OK] Layout set ({len(charts_with_pos)} charts)")
    return dash_id


def cnt(col, label="Count"):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "BIGINT"},
            "aggregate": "COUNT", "optionName": f"_{col}"}

def sm(col, label="Sum"):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "DECIMAL"},
            "aggregate": "SUM", "optionName": f"_{col}"}

def avg(col, label="Avg"):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "DECIMAL"},
            "aggregate": "AVG", "optionName": f"_{col}"}

def smf(col, label="Sum"):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "FLOAT"},
            "aggregate": "SUM", "optionName": f"_{col}"}

def avgf(col, label="Avg"):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "FLOAT"},
            "aggregate": "AVG", "optionName": f"_{col}"}

def cntd(col, label="Count Distinct"):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "BIGINT"},
            "aggregate": "COUNT_DISTINCT", "optionName": f"_{col}"}


def main():
    login()

    # Ensure DB exists in PostgreSQL first
    pg_conn = psycopg2.connect(**DB_PARAMS)
    cur = pg_conn.cursor()
    cur.execute("SELECT id FROM dbs WHERE sqlalchemy_uri LIKE '%%clickhouse%%'")
    row = cur.fetchone()
    if not row:
        print("[CREATE] Adding ClickHouse DB to PostgreSQL...")
        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM dbs")
        db_id = cur.fetchone()[0]
        db_uuid = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO dbs (id, uuid, database_name, sqlalchemy_uri, created_on, changed_on)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
        """, (db_id, db_uuid, "ClickHouse Analytics", "clickhousedb://admin:admin@olap_retail:8123/analytics"))
        pg_conn.commit()
        print(f"[OK] DB created in PG (id={db_id})")
    else:
        db_id = row[0]
        print(f"[OK] DB exists in PG (id={db_id})")

    # Now get db_id from API for dataset creation
    db_id = get_db_id()
    if not db_id:
        print("[ERR] No ClickHouse DB"); pg_conn.close(); return
    print(f"[OK] DB id={db_id}")

    # Создаём датасеты через SQL
    print("\n[DB] Creating datasets...")
    datasets = {}
    for table in TABLE_COLUMNS:
        ds_id = create_dataset(pg_conn, db_id, table)
        datasets[table] = ds_id
    pg_conn.close()

    def ds(name):
        return datasets.get(name)

    # ===================== DASH 1 =====================
    print("\n========== DASH 1: Sales & Orders ==========")
    c1 = []
    i = ds("orders_facts")
    if i:
        cid = create_chart_api(i, "Total Orders", "big_number_total",
            metrics=[cnt("order_id", "Total Orders")])
        c1.append((cid, (0, 0, 4, 2)))

        cid = create_chart_api(i, "Total Revenue", "big_number_total",
            metrics=[sm("total_amount", "Revenue")])
        c1.append((cid, (4, 0, 4, 2)))

        cid = create_chart_api(i, "Avg Order Value", "big_number",
            metrics=[avg("total_amount", "Avg Order")])
        c1.append((cid, (8, 0, 4, 2)))

        cid = create_chart_api(i, "Revenue by Day", "echarts_timeseries_line",
            metrics=[sm("total_amount", "Revenue")],
            granularity="order_date")
        c1.append((cid, (0, 2, 12, 4)))

        cid = create_chart_api(i, "Orders by Status", "pie",
            metrics=[cnt("order_id", "Orders")],
            groupby=["order_status"])
        c1.append((cid, (0, 6, 6, 4)))

        cid = create_chart_api(i, "Revenue by Category", "bar",
            metrics=[sm("total_amount", "Revenue")],
            groupby=["product_category"], row_limit=10)
        c1.append((cid, (6, 6, 6, 4)))
    create_dashboard("Sales & Orders Overview", c1)

    # ===================== DASH 2 =====================
    print("\n========== DASH 2: Customers ==========")
    c2 = []
    i = ds("customer_metrics")
    if i:
        cid = create_chart_api(i, "Total Customers", "big_number_total",
            metrics=[cntd("user_id", "Customers")])
        c2.append((cid, (0, 0, 4, 2)))

        cid = create_chart_api(i, "Avg Health Score", "big_number",
            metrics=[avgf("customer_health_score", "Health")])
        c2.append((cid, (4, 0, 4, 2)))

        cid = create_chart_api(i, "Avg Lifetime Value", "big_number_total",
            metrics=[avg("lifetime_value", "LTV")])
        c2.append((cid, (8, 0, 4, 2)))

        cid = create_chart_api(i, "RFM Segments", "pie",
            metrics=[cntd("user_id", "Customers")],
            groupby=["rfm_segment"])
        c2.append((cid, (0, 2, 6, 4)))

        cid = create_chart_api(i, "Top Favorite Categories", "bar",
            metrics=[cntd("user_id", "Users")],
            groupby=["favorite_category"], row_limit=10)
        c2.append((cid, (6, 2, 6, 4)))

    i = ds("customer_loyalty")
    if i:
        cid = create_chart_api(i, "Loyalty Level Distribution", "bar",
            metrics=[cntd("user_id", "Customers")],
            groupby=["current_loyalty_level"])
        c2.append((cid, (0, 6, 6, 4)))

    i = ds("mv_churn_health")
    if i:
        cid = create_chart_api(i, "Avg Churn Probability", "big_number",
            metrics=[avgf("avg_churn_prob", "Churn")])
        c2.append((cid, (6, 6, 6, 2)))

        cid = create_chart_api(i, "Avg Health Score Trend", "big_number",
            metrics=[avgf("avg_health_score", "Health")])
        c2.append((cid, (6, 8, 6, 2)))
    create_dashboard("Customers & Loyalty", c2)

    # ===================== DASH 3 =====================
    print("\n========== DASH 3: Realtime ==========")
    c3 = []
    i = ds("orders_realtime")
    if i:
        cid = create_chart_api(i, "Orders in Window", "big_number_total",
            metrics=[smf("total_orders", "Orders")])
        c3.append((cid, (0, 0, 4, 2)))

        cid = create_chart_api(i, "Revenue in Window", "big_number_total",
            metrics=[smf("total_revenue", "Revenue")])
        c3.append((cid, (4, 0, 4, 2)))

        cid = create_chart_api(i, "Unique Users", "big_number",
            metrics=[smf("unique_users", "Users")])
        c3.append((cid, (8, 0, 4, 2)))

        cid = create_chart_api(i, "Order Flow", "echarts_timeseries_bar",
            metrics=[smf("total_orders", "Orders")],
            groupby=["window_start"])
        c3.append((cid, (0, 2, 12, 4)))

    i = ds("user_activity")
    if i:
        cid = create_chart_api(i, "Activity by Type", "pie",
            metrics=[cnt("id", "Events")],
            groupby=["activity_type"])
        c3.append((cid, (0, 6, 6, 4)))

        cid = create_chart_api(i, "Activity by Device", "bar",
            metrics=[cnt("id", "Events")],
            groupby=["device_type"])
        c3.append((cid, (6, 6, 6, 4)))
    create_dashboard("Realtime Monitor", c3)

    print("\n========== DONE ==========")
    print("Open http://localhost:8088")

if __name__ == "__main__":
    main()
