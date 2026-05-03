"""
Airflow DAG: Business KPI Dashboard

Collects business KPIs from ClickHouse, compares with previous period,
detects anomalies, stores results in S3, and alerts on threshold breaches.

Features:
- TaskGroup for domain-based organization (revenue, customers, products)
- Parallel metric computation within groups
- Airflow Variables for alert thresholds
- Dynamic task mapping for per-category metrics
- BranchPythonOperator for anomaly alerting
- JSON reports to S3 with trend analysis

Schedule: daily at 06:00 UTC (after ETL at 02:00 and data quality at 04:00)
"""

import os
import json
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, List

import boto3
import requests
from botocore.client import Config
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.utils.task_group import TaskGroup
from airflow.models import Variable
import logging

# ============================================================
# Configuration — override via Airflow Variables / env
# ============================================================
CH_HOST = os.getenv("CH_HOST", "clickhouse")
CH_PORT = int(os.getenv("CH_HTTP_PORT", "8123"))
CH_USER = os.getenv("CH_USER", "admin")
CH_PASSWORD = os.getenv("CH_PASSWORD", "admin")
CH_DATABASE = "analytics"

S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localstack:4566")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "test")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "test")
S3_BUCKET = os.getenv("S3_BUCKET", "etl-staging")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.mail.ru")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "stratum-platform@mail.ru")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

DEFAULT_ARGS = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=3),
    "execution_timeout": timedelta(minutes=20),
}


def _ch_query(query: str) -> str:
    url = f"http://{CH_HOST}:{CH_PORT}/?query={urllib.parse.quote(query)}"
    resp = requests.get(url, auth=(CH_USER, CH_PASSWORD), timeout=30)
    resp.raise_for_status()
    return resp.text.strip()


def _s3_client():
    return boto3.client(
        "s3", endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )


# ============================================================
# KPI Query Definitions
# ============================================================

REVENUE_METRICS = {
    "daily_revenue": """
        SELECT toStartOfDay(order_date) AS day, count() AS orders,
               sum(total_amount) AS revenue, uniq(user_id) AS unique_buyers
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 14 DAY
        GROUP BY day ORDER BY day FORMAT JSONEachRow
    """,
    "revenue_by_payment": """
        SELECT payment_method, count() AS orders, sum(total_amount) AS revenue,
               round(avg(total_amount), 2) AS avg_order
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 7 DAY
        GROUP BY payment_method ORDER BY revenue DESC FORMAT JSONEachRow
    """,
    "revenue_by_device": """
        SELECT device_type, count() AS orders, sum(total_amount) AS revenue,
               round(avg(total_amount), 2) AS avg_order
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 7 DAY
        GROUP BY device_type ORDER BY revenue DESC FORMAT JSONEachRow
    """,
    "revenue_by_channel": """
        SELECT source_channel, count() AS orders, sum(total_amount) AS revenue
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 7 DAY
        GROUP BY source_channel ORDER BY revenue DESC FORMAT JSONEachRow
    """,
}

CUSTOMER_METRICS = {
    "customer_segments": """
        SELECT
            CASE
                WHEN total_orders >= 5 AND total_revenue >= 5000 THEN 'VIP'
                WHEN total_orders >= 3 AND total_revenue >= 2000 THEN 'Loyal'
                WHEN total_orders >= 1 THEN 'Active'
                ELSE 'Dormant'
            END AS segment,
            count() AS customers,
            sum(total_revenue) AS total_revenue
        FROM (
            SELECT user_id, count() AS total_orders, sum(total_amount) AS total_revenue
            FROM analytics.orders_flat
            GROUP BY user_id
        )
        GROUP BY segment ORDER BY total_revenue DESC FORMAT JSONEachRow
    """,
    "new_vs_returning": """
        SELECT
            CASE WHEN prev_orders = 0 THEN 'new' ELSE 'returning' END AS customer_type,
            count() AS orders,
            sum(total_amount) AS revenue
        FROM analytics.orders_flat
        LEFT JOIN (
            SELECT user_id, count() AS prev_orders
            FROM analytics.orders_flat
            WHERE order_date < today() - INTERVAL 7 DAY
            GROUP BY user_id
        ) USING user_id
        WHERE order_date >= today() - INTERVAL 7 DAY
        GROUP BY customer_type FORMAT JSONEachRow
    """,
    "top_buyers": """
        SELECT user_id, count() AS orders, sum(total_amount) AS total_spent,
               round(avg(total_amount), 2) AS avg_order
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 30 DAY
        GROUP BY user_id ORDER BY total_spent DESC LIMIT 10 FORMAT JSONEachRow
    """,
}

PRODUCT_METRICS = {
    "top_categories": """
        SELECT product_category, count() AS orders, sum(item_total) AS revenue,
               uniq(user_id) AS buyers, sum(quantity) AS units
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 14 DAY
        GROUP BY product_category ORDER BY revenue DESC FORMAT JSONEachRow
    """,
    "low_stock_products": """
        SELECT warehouse_name, product_name, quantity_available, min_stock_level,
               reorder_point
        FROM analytics.inventory
        WHERE quantity_available < min_stock_level
           OR (reorder_point IS NOT NULL AND quantity_available + quantity_reserved < reorder_point)
        FORMAT JSONEachRow
    """,
    "top_brands": """
        SELECT product_brand, count() AS orders, sum(item_total) AS revenue,
               round(avg(item_price), 2) AS avg_price
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 14 DAY AND product_brand != ''
        GROUP BY product_brand ORDER BY revenue DESC LIMIT 10 FORMAT JSONEachRow
    """,
}

REVIEW_METRICS = {
    "rating_distribution": """
        SELECT rating, count() AS review_count,
               round(avg(rating) OVER (), 2) AS overall_avg
        FROM analytics.reviews
        WHERE created_at >= now() - INTERVAL 30 DAY
        GROUP BY rating ORDER BY rating FORMAT JSONEachRow
    """,
    "recent_reviews": """
        SELECT product_name, rating, title, content, verified_purchase,
               toStartOfDay(created_at) AS review_date
        FROM analytics.reviews
        WHERE created_at >= now() - INTERVAL 7 DAY
        ORDER BY created_at DESC LIMIT 20 FORMAT JSONEachRow
    """,
}


# ============================================================
# Task Functions
# ============================================================

def run_kpi_group(metric_group: str, queries: dict, **context):
    """Execute a group of KPI queries and store results."""
    run_date = context["ds"]
    results = {}

    for metric_name, query in queries.items():
        try:
            raw = _ch_query(query)
            rows = []
            for line in raw.split("\n"):
                if line.strip():
                    try:
                        rows.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue

            results[metric_name] = {
                "status": "success",
                "rows": len(rows),
                "data": rows,
            }
            logging.info(f"  [{metric_group}] {metric_name}: {len(rows)} rows")

        except Exception as e:
            results[metric_name] = {
                "status": "error",
                "error": str(e)[:200],
            }
            logging.error(f"  [{metric_group}] {metric_name}: {e}")

    # Store in XCom
    context["ti"].xcom_push(key=metric_group, value=results)
    return results


def compute_category_metrics(**context):
    """Run per-category metrics with dynamic data."""
    run_date = context["ds"]

    # Get categories from ClickHouse
    raw = _ch_query("""
        SELECT product_category, count() AS orders, sum(item_total) AS revenue,
               uniq(user_id) AS buyers
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 30 DAY
        GROUP BY product_category ORDER BY revenue DESC FORMAT JSONEachRow
    """)

    categories = []
    for line in raw.split("\n"):
        if line.strip():
            try:
                categories.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    # Store full list
    context["ti"].xcom_push(key="category_list", value=categories)
    logging.info(f"Found {len(categories)} active categories")

    return [c["product_category"] for c in categories]


def compute_trends_and_anomalies(**context):
    """Compare current vs previous period, detect anomalies."""
    ti = context["ti"]

    # Get alert thresholds from Airflow Variables
    try:
        thresholds = json.loads(Variable.get("kpi_alert_thresholds"))
    except Exception:
        thresholds = {
            "revenue_drop_pct": 30,      # alert if revenue drops >30%
            "orders_drop_pct": 25,       # alert if orders drop >25%
            "min_orders_per_day": 1,     # alert if <1 order per day
        }

    # Compare last 7 days vs previous 7 days
    raw_current = _ch_query("""
        SELECT count() AS orders, sum(total_amount) AS revenue,
               uniq(user_id) AS buyers
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 7 DAY
        AND order_date < today()
    """)
    raw_previous = _ch_query("""
        SELECT count() AS orders, sum(total_amount) AS revenue,
               uniq(user_id) AS buyers
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 14 DAY
        AND order_date < today() - INTERVAL 7 DAY
    """)

    def parse_row(text):
        for line in text.split("\n"):
            if line.strip():
                try:
                    return json.loads(line)
                except Exception:
                    pass
        return {}

    current = parse_row(raw_current)
    previous = parse_row(raw_previous)

    # Calculate changes
    rev_change = 0
    if previous.get("revenue", 0):
        rev_change = round((current.get("revenue", 0) - previous["revenue"]) / previous["revenue"] * 100, 1)

    ord_change = 0
    if previous.get("orders", 0):
        ord_change = round((current.get("orders", 0) - previous["orders"]) / previous["orders"] * 100, 1)

    alerts = []
    if rev_change < -thresholds.get("revenue_drop_pct", 30):
        alerts.append(f"🔴 Revenue dropped {abs(rev_change)}% vs last week")
    if ord_change < -thresholds.get("orders_drop_pct", 25):
        alerts.append(f"🔴 Orders dropped {abs(ord_change)}% vs last week")
    if current.get("orders", 0) < thresholds.get("min_orders_per_day", 1):
        alerts.append(f"🔴 No orders in last 7 days")

    trend_report = {
        "run_date": context["ds"],
        "current_period": {
            "orders": current.get("orders", 0),
            "revenue": current.get("revenue", 0),
            "buyers": current.get("buyers", 0),
        },
        "previous_period": {
            "orders": previous.get("orders", 0),
            "revenue": previous.get("revenue", 0),
            "buyers": previous.get("buyers", 0),
        },
        "change_pct": {
            "orders": ord_change,
            "revenue": rev_change,
        },
        "alerts": alerts,
    }

    ti.xcom_push(key="trend_report", value=trend_report)

    # Decide branch
    if alerts:
        return "send_alert_email"
    return "no_alerts_needed"


def send_alert_email(**context):
    """Send alert email when KPI anomalies detected."""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    ti = context["ti"]
    trend = ti.xcom_pull(key="trend_report", task_ids="compute_trends_and_anomalies") or {}
    alerts = trend.get("alerts", [])
    if not alerts:
        return "No alerts triggered"

    # Recipients
    try:
        recipients = [r.strip() for r in Variable.get("report_recipients").split(",")]
    except Exception:
        recipients = ["yarik_02022005@mail.ru", "yastremskiy_2014@mail.ru", "yarik02022005@mail.ru"]

    current = trend.get("current_period", {})
    previous = trend.get("previous_period", {})
    change = trend.get("change_pct", {})

    html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fef2f2;font-family:sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:20px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:2px solid #ef4444;">
<tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px;text-align:center;">
    <h1 style="color:#fff;margin:0;">⚠️ KPI Alert</h1>
</td></tr>
<tr><td style="padding:24px;">
    <h2 style="margin:0 0 16px;color:#991b1b;">Anomaly Detected</h2>
    <ul style="color:#991b1b;font-size:16px;">
    {''.join(f'<li>{a}</li>' for a in alerts)}
    </ul>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr style="background:#f9fafb;"><td style="padding:8px;border:1px solid #e5e7eb;">Metric</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">Current</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">Previous</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">Change</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb;">Orders</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">{current.get('orders', 0)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">{previous.get('orders', 0)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;color:{'#ef4444' if change.get('orders',0)<0 else '#10b981'};">{change.get('orders', 0)}%</td></tr>
    <tr><td style="padding:8px;border:1px solid #e5e7eb;">Revenue</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">{current.get('revenue', 0)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">{previous.get('revenue', 0)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;color:{'#ef4444' if change.get('revenue',0)<0 else '#10b981'};">{change.get('revenue', 0)}%</td></tr>
    </table>
</td></tr>
<tr><td style="background:#f9fafb;padding:12px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
    Auto alert — Marketplace Analytics Platform
</td></tr>
</table></td></tr></table></body></html>"""

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = f"⚠️ KPI Alert: {', '.join(a[:40] for a in alerts[:2])} — {context['ds']}"
    msg.attach(MIMEText(html, "html", "utf-8"))

    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
    server.starttls()
    server.login(SMTP_USER, SMTP_PASSWORD)
    server.sendmail(SMTP_FROM, recipients, msg.as_string())
    server.quit()

    logging.info(f"Alert email sent to {recipients}: {alerts}")
    return f"Alert sent: {alerts}"


def export_to_s3(**context):
    """Export all KPI results to S3 as structured JSON."""
    ti = context["ti"]
    run_date = context["ds"]

    # Collect all results from XCom
    all_data = {
        "run_date": run_date,
        "generated_at": datetime.now().isoformat(),
        "revenue": ti.xcom_pull(key="revenue", task_ids="revenue_group.run_kpi_revenue") or {},
        "customers": ti.xcom_pull(key="customers", task_ids="customer_group.run_kpi_customers") or {},
        "products": ti.xcom_pull(key="products", task_ids="product_group.run_kpi_products") or {},
        "reviews": ti.xcom_pull(key="reviews", task_ids="review_group.run_kpi_reviews") or {},
        "categories": ti.xcom_pull(key="category_list", task_ids="compute_category_metrics") or [],
        "trends": ti.xcom_pull(key="trend_report", task_ids="compute_trends_and_anomalies") or {},
    }

    # Clean data (remove raw rows for storage, keep summaries)
    for section in ["revenue", "customers", "products", "reviews"]:
        if isinstance(all_data.get(section), dict):
            for kpi_name, kpi_data in all_data[section].items():
                if isinstance(kpi_data, dict) and "data" in kpi_data:
                    kpi_data["sample"] = kpi_data["data"][:5]
                    del kpi_data["data"]

    s3 = _s3_client()
    try:
        s3.head_bucket(Bucket=S3_BUCKET)
    except Exception:
        s3.create_bucket(Bucket=S3_BUCKET)

    # Full report
    full_key = f"reports/kpi/{run_date}/full_report.json"
    s3.put_object(
        Bucket=S3_BUCKET, Key=full_key,
        Body=json.dumps(all_data, indent=2, default=str, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )
    logging.info(f"S3: {full_key}")

    # Summary (lightweight, for dashboard consumption)
    summary = {
        "run_date": run_date,
        "revenue_metrics": {
            m: v.get("rows", 0) if isinstance(v, dict) else 0
            for m, v in (all_data.get("revenue") or {}).items()
        },
        "customer_segments": (all_data.get("customers") or {}).get("customer_segments", {}),
        "trend_change": (all_data.get("trends") or {}).get("change_pct", {}),
        "alerts": (all_data.get("trends") or {}).get("alerts", []),
        "total_categories": len(all_data.get("categories", [])),
    }
    summary_key = f"reports/kpi/{run_date}/summary.json"
    s3.put_object(
        Bucket=S3_BUCKET, Key=summary_key,
        Body=json.dumps(summary, indent=2, default=str, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )
    logging.info(f"S3: {summary_key}")

    # Set Airflow Variable with summary (for downstream consumers)
    Variable.set(f"kpi_summary_{run_date}", json.dumps(summary, default=str))


def final_summary(**context):
    """Print execution summary."""
    ti = context["ti"]
    trend = ti.xcom_pull(key="trend_report", task_ids="compute_trends_and_anomalies") or {}

    logging.info("=" * 70)
    logging.info("KPI DASHBOARD — FINAL SUMMARY")
    logging.info("=" * 70)
    logging.info(f"Date: {context['ds']}")
    change = trend.get("change_pct", {})
    logging.info(f"Revenue change: {change.get('revenue', 'N/A')}%")
    logging.info(f"Orders change: {change.get('orders', 'N/A')}%")
    alerts = trend.get("alerts", [])
    if alerts:
        logging.warning(f"Alerts: {alerts}")
    else:
        logging.info("No anomalies detected ✅")
    logging.info("=" * 70)


# ============================================================
# DAG Definition
# ============================================================
with DAG(
    dag_id="business_kpi_dashboard",
    default_args=DEFAULT_ARGS,
    description="Business KPI computation, trend analysis, and alerting",
    schedule_interval="0 6 * * *",  # daily at 06:00 UTC
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["kpi", "business", "analytics", "alerting", "reporting"],
    max_active_runs=1,
) as dag:

    # ─── Revenue TaskGroup ───
    with TaskGroup("revenue_group", tooltip="Revenue metrics") as revenue_group:
        t_revenue = PythonOperator(
            task_id="run_kpi_revenue",
            python_callable=run_kpi_group,
            op_kwargs={"metric_group": "revenue", "queries": REVENUE_METRICS},
        )

    # ─── Customer TaskGroup ───
    with TaskGroup("customer_group", tooltip="Customer metrics") as customer_group:
        t_customers = PythonOperator(
            task_id="run_kpi_customers",
            python_callable=run_kpi_group,
            op_kwargs={"metric_group": "customers", "queries": CUSTOMER_METRICS},
        )

    # ─── Product TaskGroup ───
    with TaskGroup("product_group", tooltip="Product metrics") as product_group:
        t_products = PythonOperator(
            task_id="run_kpi_products",
            python_callable=run_kpi_group,
            op_kwargs={"metric_group": "products", "queries": PRODUCT_METRICS},
        )

    # ─── Review TaskGroup ───
    with TaskGroup("review_group", tooltip="Review metrics") as review_group:
        t_reviews = PythonOperator(
            task_id="run_kpi_reviews",
            python_callable=run_kpi_group,
            op_kwargs={"metric_group": "reviews", "queries": REVIEW_METRICS},
        )

    # ─── Category metrics (dynamic) ───
    t_categories = PythonOperator(
        task_id="compute_category_metrics",
        python_callable=compute_category_metrics,
    )

    # ─── Trends & Anomalies ───
    t_trends = PythonOperator(
        task_id="compute_trends_and_anomalies",
        python_callable=compute_trends_and_anomalies,
    )

    # ─── Branch for alert email ───
    t_branch = BranchPythonOperator(
        task_id="check_anomalies",
        python_callable=lambda **ctx: "send_alert_email" if ctx["ti"].xcom_pull(
            key="trend_report", task_ids="compute_trends_and_anomalies"
        ).get("alerts") else "no_alerts_needed",
    )

    t_alert = PythonOperator(
        task_id="send_alert_email",
        python_callable=send_alert_email,
    )

    t_no_alert = PythonOperator(
        task_id="no_alerts_needed",
        python_callable=lambda: logging.info("No anomalies, skipping alert"),
    )

    # ─── Export ───
    t_export = PythonOperator(
        task_id="export_to_s3",
        python_callable=export_to_s3,
        trigger_rule="none_failed_min_one_success",
    )

    # ─── Final Summary ───
    t_summary = PythonOperator(
        task_id="final_summary",
        python_callable=final_summary,
        trigger_rule="all_done",
    )

    # Dependencies
    # All metric groups run in parallel
    [revenue_group, customer_group, product_group, review_group] >> t_categories >> t_trends >> t_branch
    t_branch >> t_alert >> t_export
    t_branch >> t_no_alert >> t_export
    t_export >> t_summary
