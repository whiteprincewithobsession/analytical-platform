"""
Восстановление Customer 360 Intelligence Dashboard через Superset API.
"""
import requests
import json

SUPERSET_URL = "http://localhost:8088"
session = requests.Session()

def login():
    r = session.post(f"{SUPERSET_URL}/api/v1/security/login",
        json={"username": "admin", "password": "admin", "provider": "db", "refresh": True})
    r.raise_for_status()
    session.headers.update({"Authorization": f"Bearer {r.json()['access_token']}"})
    print("[OK] Login")

def get_datasets():
    r = session.get(f"{SUPERSET_URL}/api/v1/dataset/")
    r.raise_for_status()
    return {d["table_name"]: d["id"] for d in r.json().get("result", [])}

def create_chart(ds_id, title, viz_type, metrics, granularity=None, groupby=None, row_limit=10000):
    params = {
        "datasource": f"{ds_id}__table",
        "viz_type": viz_type,
        "adhoc_filters": [],
        "row_limit": row_limit,
        "metrics": metrics,
    }
    if granularity:
        params["granularity_sqla"] = granularity
        params["time_grain_sqla"] = "P1D"
    if groupby:
        params["groupby"] = groupby

    ctx = {
        "datasource": {"id": ds_id, "type": "table"},
        "viz_type": viz_type,
        "metrics": metrics,
        "adhoc_filters": [],
        "row_limit": row_limit,
    }
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

def sql_metric(label, sql_expression):
    return {"label": label, "expressionType": "SQL", "sqlExpression": sql_expression}

def cnt_metric(col, label):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "BIGINT"},
            "aggregate": "COUNT", "optionName": f"_{col}"}

def sum_metric(col, label):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "DECIMAL"},
            "aggregate": "SUM", "optionName": f"_{col}"}

def avg_metric(col, label):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "DECIMAL"},
            "aggregate": "AVG", "optionName": f"_{col}"}

def avgf_metric(col, label):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "FLOAT"},
            "aggregate": "AVG", "optionName": f"_{col}"}

def cntd_metric(col, label):
    return {"label": label, "expressionType": "SIMPLE",
            "column": {"column_name": col, "type": "BIGINT"},
            "aggregate": "COUNT_DISTINCT", "optionName": f"_{col}"}

def create_dashboard(title, charts_with_pos):
    r = session.post(f"{SUPERSET_URL}/api/v1/dashboard/", json={"dashboard_title": title})
    if r.status_code not in (200, 201):
        print(f"  [ERR] Create: {r.status_code}"); return None
    dash_id = r.json()["id"]
    print(f"  [DASH] '{title}' (id={dash_id})")

    pos = {
        "DASHBOARD_VERSION_KEY": "v2",
        "ROOT_ID": {"children": ["GRID_ID"], "id": "ROOT_ID", "type": "ROOT"},
        "GRID_ID": {"children": [], "id": "GRID_ID", "type": "GRID", "parents": ["ROOT_ID"]},
        "HEADER_ID": {"id": "HEADER_ID", "type": "HEADER", "meta": {"text": title}},
    }
    for i, (cid, p) in enumerate(charts_with_pos):
        if cid is None: continue
        x, y, w, h = p
        ck, tk = f"CHART-{cid}", f"TAB-{i}"
        pos[ck] = {"id": ck, "type": "CHART", "meta": {"chartId": cid, "height": h*25, "width": w},
                    "children": [], "parents": ["ROOT_ID", "GRID_ID", tk]}
        pos[tk] = {"id": tk, "type": "TABS", "meta": {}, "children": [ck], "parents": ["ROOT_ID", "GRID_ID"]}
        pos["GRID_ID"]["children"].append(tk)

    r = session.put(f"{SUPERSET_URL}/api/v1/dashboard/{dash_id}",
        json={"position_json": json.dumps(pos)})
    if r.status_code in (200, 201):
        print(f"  [OK] Layout ({len(charts_with_pos)} charts)")
    return dash_id


def main():
    login()
    datasets = get_datasets()
    print(f"[OK] Datasets: {datasets}")

    # Customer 360 использует customer_metrics
    cm_id = datasets.get("customer_metrics")
    if not cm_id:
        print("[ERR] customer_metrics not found"); return
    print(f"[OK] customer_metrics id={cm_id}")

    # Удаляем старый пустой дашборд 360
    r = session.get(f"{SUPERSET_URL}/api/v1/dashboard/")
    for d in r.json().get("result", []):
        if "360" in d.get("dashboard_title", ""):
            session.delete(f"{SUPERSET_URL}/api/v1/dashboard/{d['id']}")
            print(f"[DEL] Old 360 dashboard id={d['id']}")
    # Удаляем все чарты кроме новых
    r = session.get(f"{SUPERSET_URL}/api/v1/chart/")
    for c in r.json().get("result", []):
        name = c.get("slice_name", "")
        if "360" in name or "Health" in name or "LTV" in name or "Active" in name or "Churn" in name or "Lifetime" in name or "Champion" in name or "Cohort" in name:
            session.delete(f"{SUPERSET_URL}/api/v1/chart/{c['id']}")

    print("\n========== Customer 360 Dashboard ==========")
    charts = []

    # 1. Health Score Distribution (bar chart по health_score)
    cid = create_chart(cm_id, "Health Score Distribution", "bar",
        metrics=[cnt_metric("user_id", "Customers")],
        groupby=["customer_health_score"], row_limit=20)
    charts.append((cid, (0, 0, 6, 4)))

    # 2. Total Active Customers (30d)
    cid = create_chart(cm_id, "Total Active Customers (30d)", "big_number_total",
        metrics=[sql_metric("Active 30d", "countIf(is_active_30d = 1)")])
    charts.append((cid, (6, 0, 3, 2)))

    # 3. Total LTV
    cid = create_chart(cm_id, "Total LTV", "big_number_total",
        metrics=[sum_metric("lifetime_value", "Total LTV")])
    charts.append((cid, (9, 0, 3, 2)))

    # 4. Average Lifetime Score
    cid = create_chart(cm_id, "Average Lifetime Score", "big_number",
        metrics=[avgf_metric("customer_health_score", "Avg Health")])
    charts.append((cid, (6, 2, 3, 2)))

    # 5. Churn Clients
    cid = create_chart(cm_id, "Churn Clients", "big_number",
        metrics=[sql_metric("Churned", "countIf(churn_probability > 0.7)")])
    charts.append((cid, (9, 2, 3, 2)))

    # 6. RFM Segments (pie)
    cid = create_chart(cm_id, "Customer Segments (RFM)", "pie",
        metrics=[cntd_metric("user_id", "Customers")],
        groupby=["rfm_segment"])
    charts.append((cid, (0, 4, 6, 4)))

    # 7. Top Favorite Categories (bar)
    cid = create_chart(cm_id, "Top Favorite Categories", "bar",
        metrics=[cntd_metric("user_id", "Users")],
        groupby=["favorite_category"], row_limit=10)
    charts.append((cid, (6, 4, 6, 4)))

    create_dashboard("Customer 360 Intelligence Dashboard", charts)

    print("\n[DONE] Open http://localhost:8088")

if __name__ == "__main__":
    main()
