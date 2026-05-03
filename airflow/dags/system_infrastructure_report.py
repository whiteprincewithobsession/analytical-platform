"""
Airflow DAG: System Infrastructure Report

Collects health & stats from ALL services (PostgreSQL, ClickHouse,
Airflow, Spark, Kafka, Flink, LocalStack, Superset) and sends a
formatted HTML email report.

No Spark, no email-api — pure Python + HTTP requests.

Schedule: weekly on Monday at 09:00 UTC
Recipients: configured via Airflow Variable `report_recipients`
"""

import os
import json
import urllib.parse
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
import boto3
from botocore.client import Config
import psycopg2

from airflow import DAG
from airflow.operators.python import PythonOperator
import logging

# ============================================================
# Configuration — override via Airflow Variables / env
# ============================================================
CH_HOST = os.getenv("CH_HOST", "clickhouse")
CH_PORT = int(os.getenv("CH_HTTP_PORT", "8123"))
CH_USER = os.getenv("CH_USER", "admin")
CH_PASSWORD = os.getenv("CH_PASSWORD", "admin")
CH_DATABASE = "analytics"

PG_HOST = os.getenv("PG_HOST", "retail_container")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_USER = os.getenv("PG_USER", "admin")
PG_PASSWORD = os.getenv("PG_PASSWORD", "admin")
PG_DB = os.getenv("PG_DATABASE", "omni_retail_core")

AIRFLOW_URL = os.getenv("AIRFLOW_URL", "http://airflow_webserver:8080")
AIRFLOW_USER = os.getenv("AIRFLOW_USER", "airflow")
AIRFLOW_PASSWORD = os.getenv("AIRFLOW_PASSWORD", "airflow")

SPARK_URL = os.getenv("SPARK_URL", "http://spark-master:8080")
KAFKA_UI_URL = os.getenv("KAFKA_UI_URL", "http://kafka-ui:8090")
FLINK_URL = os.getenv("FLINK_URL", "http://flink-jobmanager:8084")
LOCALSTACK_URL = os.getenv("LOCALSTACK_URL", "http://localstack:4566")
SUPERSET_URL = os.getenv("SUPERSET_URL", "http://superset:8088")

DEFAULT_ARGS = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(minutes=15),
}


def _ch_get(query: str) -> str:
    ch_url = f"http://{CH_HOST}:{CH_PORT}/?query={urllib.parse.quote(query)}"
    resp = requests.get(ch_url, auth=(CH_USER, CH_PASSWORD), timeout=15)
    resp.raise_for_status()
    return resp.text.strip()


def _pg_conn():
    return psycopg2.connect(
        host=PG_HOST, port=PG_PORT, database=PG_DB,
        user=PG_USER, password=PG_PASSWORD,
    )


# ─── Service Collectors ────────────────────────────────────

def _check(name, fn):
    try:
        result = fn()
        result["service"] = name
        result.setdefault("status", "healthy")
        return result
    except Exception as e:
        return {"service": name, "status": "error", "error": str(e), "details": {}}


def check_clickhouse():
    version = _ch_get("SELECT version()")
    dbs = _ch_get("SELECT name FROM system.databases ORDER BY name").split("\n")
    tables_raw = _ch_get(
        "SELECT database, name, total_rows, formatReadableSize(total_bytes) "
        "FROM system.tables WHERE database = 'analytics' ORDER BY total_rows DESC"
    )
    tables = []
    for line in tables_raw.split("\n"):
        p = line.split("\t")
        if len(p) >= 3:
            tables.append({"table": p[1], "rows": p[2], "size": p[3] if len(p) > 3 else "0 B"})

    return {
        "details": {
            "version": version,
            "databases": [d for d in dbs if d],
            "top_tables": tables[:10],
            "total_analytics_tables": len(tables),
        }
    }


def check_postgresql():
    conn = _pg_conn()
    cur = conn.cursor()
    cur.execute("SELECT version()")
    ver = cur.fetchone()[0][:60]
    cur.execute("SELECT count(*) FROM pg_stat_activity")
    conns = cur.fetchone()[0]
    cur.execute("SELECT pg_size_pretty(pg_database_size(%s))", (PG_DB,))
    size = cur.fetchone()[0]
    cur.execute("""
        SELECT schemaname, count(*) FROM pg_stat_user_tables
        GROUP BY schemaname ORDER BY count(*) DESC
    """)
    schemas = dict(cur.fetchall())
    cur.execute("SELECT count(*) FROM pg_stat_activity WHERE state='active' AND pid!=pg_backend_pid()")
    active = cur.fetchone()[0]
    conn.close()
    return {
        "details": {
            "version": ver,
            "connections": conns,
            "active_queries": active,
            "db_size": size,
            "tables_by_schema": schemas,
        }
    }


def check_airflow():
    session = requests.Session()
    # Login
    try:
        r = session.get(f"{AIRFLOW_URL}/login/", timeout=10)
        import re
        csrf = re.search(r'name="csrf_token"\s+value="([^"]+)"', r.text)
        csrf_token = csrf.group(1) if csrf else ""
        r2 = session.post(f"{AIRFLOW_URL}/login/", data={
            "username": AIRFLOW_USER, "password": AIRFLOW_PASSWORD,
            "csrf_token": csrf_token,
        }, timeout=10)
        if r2.status_code not in (200, 302):
            return {"status": "error", "error": f"Login failed: {r2.status_code}", "details": {}}
    except Exception as e:
        return {"status": "error", "error": str(e), "details": {}}

    # Health
    try:
        r = session.get(f"{AIRFLOW_URL}/health", timeout=10)
        h = r.json() if r.status_code == 200 else {}
    except Exception:
        h = {}

    # List DAGs via API v1
    try:
        r = session.get(f"{AIRFLOW_URL}/api/v1/dags?limit=100", timeout=10)
        if r.status_code == 200:
            dags = r.json().get("dags", [])
        elif r.status_code == 401:
            # Try basic auth instead of session
            r2 = requests.get(
                f"{AIRFLOW_URL}/api/v1/dags?limit=100",
                auth=(AIRFLOW_USER, AIRFLOW_PASSWORD),
                timeout=10,
            )
            dags = r2.json().get("dags", []) if r2.status_code == 200 else []
        else:
            dags = []
    except Exception:
        dags = []

    return {
        "details": {
            "scheduler": h.get("scheduler", {}).get("status", "unknown"),
            "metadatabase": h.get("metadatabase", {}).get("status", "unknown"),
            "dag_count": len(dags),
            "dags": [{"id": d["dag_id"], "paused": d["is_paused"]} for d in dags],
        }
    }


def check_spark():
    r = requests.get(SPARK_URL, timeout=10)
    if r.status_code == 200:
        import re
        workers = re.findall(r'<td>(\d+\.\d+\.\d+\.\d+:\d+)</td>\s*<td>ALIVE</td>', r.text)
        apps = re.findall(r'<strong>(app-[^<]+)</strong>', r.text)
        return {"details": {"alive_workers": len(workers), "workers": workers, "apps": len(apps)}}
    return {"status": "unreachable", "details": {}}


def check_kafka():
    r = requests.get(f"{KAFKA_UI_URL}/api/clusters", timeout=10)
    if r.status_code == 200:
        clusters = r.json()
        topics_info = []
        for c in clusters:
            cid = c.get("id", "")
            tr = requests.get(f"{KAFKA_UI_URL}/api/clusters/{cid}/topics", timeout=10)
            if tr.status_code == 200:
                topics = tr.json()
                topics_info = [{"name": t["name"], "partitions": t["partitionCount"]} for t in topics[:10]]
        return {"details": {"clusters": len(clusters), "topics": topics_info}}
    return {"status": "unreachable", "details": {}}


def check_flink():
    r = requests.get(f"{FLINK_URL}/overview", timeout=10)
    if r.status_code == 200:
        d = r.json()
        return {"details": {
            "taskmanagers": d.get("taskmanagers", 0),
            "slots_total": d.get("slots-total", 0),
            "slots_available": d.get("slots-available", 0),
            "jobs_running": d.get("jobs-running", 0),
            "jobs_finished": d.get("jobs-finished", 0),
        }}
    return {"status": "unreachable", "details": {}}


def check_localstack():
    s3 = boto3.client(
        "s3", endpoint_url=LOCALSTACK_URL,
        aws_access_key_id="test", aws_secret_access_key="test",
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )
    buckets = s3.list_buckets()["Buckets"]
    bucket_info = []
    for b in buckets:
        resp = s3.list_objects_v2(Bucket=b["Name"])
        bucket_info.append({
            "name": b["Name"],
            "objects": resp.get("KeyCount", 0),
            "size_mb": round(sum(o.get("Size", 0) for o in resp.get("Contents", [])) / 1024 / 1024, 2),
        })
    return {"details": {"bucket_count": len(buckets), "buckets": bucket_info}}


def check_superset():
    session = requests.Session()
    r = session.get(f"{SUPERSET_URL}/login/", timeout=10)
    import re
    csrf = re.search(r'name="csrf_token"\s+value="([^"]+)"', r.text)
    csrf_token = csrf.group(1) if csrf else ""
    session.post(f"{SUPERSET_URL}/login/", data={
        "username": "admin", "password": "admin", "csrf_token": csrf_token,
    }, timeout=10)
    r = session.get(f"{SUPERSET_URL}/api/v1/dashboard/", timeout=10)
    dashboards = r.json().get("result", []) if r.status_code == 200 else []
    return {"details": {
        "dashboard_count": len(dashboards),
        "dashboards": [{"id": d["id"], "title": d["dashboard_title"]} for d in dashboards],
    }}


# ─── HTML Report ──────────────────────────────────────────

def _build_html(services, run_time):
    def badge(s):
        if s == "healthy":
            return '<span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">HEALTHY</span>'
        elif s == "unreachable":
            return '<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">UNREACHABLE</span>'
        return '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">ERROR</span>'

    rows = ""
    for svc in services:
        name = svc.get("service", "?")
        st = svc.get("status", "unknown")
        err = svc.get("error", "")
        det = svc.get("details", {})
        err_html = f'<tr><td colspan="2" style="color:#ef4444;padding:4px 8px;">{err}</td></tr>' if err else ""
        det_html = ""
        for k, v in det.items():
            if isinstance(v, list):
                det_html += f'<tr><td style="padding:4px 8px;color:#6b7280;">{k}</td><td style="padding:4px 8px;">{str(v)[:120]}</td></tr>'
            else:
                det_html += f'<tr><td style="padding:4px 8px;color:#6b7280;">{k}</td><td style="padding:4px 8px;">{v}</td></tr>'
        rows += f"""<tr><td colspan="2" style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
            <strong>{name}</strong> {badge(st)}
            <table style="width:100%;margin-top:6px;font-size:13px;">{err_html}{det_html}</table>
        </td></tr>"""

    healthy = len([s for s in services if s.get("status") == "healthy"])
    total = len(services)

    return f"""<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
<tr><td align="center">
<table role="presentation" width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:30px;text-align:center;">
    <h1 style="color:#fff;margin:0;">Marketplace Analytics</h1>
    <p style="color:#e0e7ff;margin:4px 0 0;">System Infrastructure Report</p>
</td></tr>
<tr><td style="padding:20px 24px;">
    <h2 style="margin:0 0 4px;">Состояние сервисов: {healthy}/{total}</h2>
    <p style="margin:0;color:#6b7280;font-size:13px;">{run_time}</p>
</td></tr>
<tr><td style="padding:0 24px 24px;"><table style="width:100%;font-size:14px;">{rows}</table></td></tr>
<tr><td style="background:#f9fafb;padding:12px 24px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
    Auto report — Marketplace Analytics Platform
</td></tr>
</table></td></tr></table></body></html>"""


# ─── Task: Collect & Send ─────────────────────────────────

def collect_and_send(**context):
    from airflow.models import Variable

    # Recipients from Airflow Variable
    try:
        recipients_str = Variable.get("report_recipients")
        recipients = [r.strip() for r in recipients_str.split(",") if r.strip()]
    except Exception:
        recipients = ["yarik_02022005@mail.ru", "yastremskiy_2014@mail.ru", "yarik02022005@mail.ru"]

    # SMTP credentials from Airflow Variables (or env fallback)
    smtp_host = os.getenv("SMTP_HOST") or Variable.get("smtp_host", default_var="smtp.mail.ru")
    smtp_port = int(os.getenv("SMTP_PORT") or Variable.get("smtp_port", default_var="587"))
    smtp_user = os.getenv("SMTP_USER") or Variable.get("smtp_user", default_var="stratum-platform@mail.ru")
    smtp_password = os.getenv("SMTP_PASSWORD") or Variable.get("smtp_password", default_var="")
    smtp_from = os.getenv("SMTP_FROM") or Variable.get("smtp_from", default_var=smtp_user)

    run_time = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    logging.info(f"Collecting system stats for {recipients}")

    collectors = [
        ("ClickHouse", check_clickhouse),
        ("PostgreSQL", check_postgresql),
        ("Apache Airflow", check_airflow),
        ("Apache Spark", check_spark),
        ("Apache Kafka", check_kafka),
        ("Apache Flink", check_flink),
        ("LocalStack (S3)", check_localstack),
        ("Apache Superset", check_superset),
    ]

    services = []
    for name, fn in collectors:
        services.append(_check(name, fn))
        logging.info(f"  {name}: {services[-1]['status']}")

    # Sort: healthy first
    services.sort(key=lambda s: 0 if s["status"] == "healthy" else 1)

    # Send email
    html = _build_html(services, run_time)
    healthy_count = len([s for s in services if s["status"] == "healthy"])
    total_count = len(services)

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_from
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = f"System Report: {healthy_count}/{total_count} healthy — {run_time}"
    msg.attach(MIMEText(html, "html", "utf-8"))

    server = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
    server.starttls()
    server.login(smtp_user, smtp_password)
    server.sendmail(smtp_from, recipients, msg.as_string())
    server.quit()

    logging.info(f"Email sent to {recipients}")

    # Push summary to XCom
    context["ti"].xcom_push(key="summary", value={
        "run_time": run_time,
        "healthy": healthy_count,
        "total": total_count,
        "recipients": recipients,
    })


# ─── DAG ──────────────────────────────────────────────────

with DAG(
    dag_id="system_infrastructure_report",
    default_args=DEFAULT_ARGS,
    description="Collect system stats from all services and email the report",
    schedule_interval="0 9 * * 1",  # Monday 09:00 UTC
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["system", "reporting", "monitoring", "email"],
    max_active_runs=1,
) as dag:

    t_report = PythonOperator(
        task_id="collect_and_send_report",
        python_callable=collect_and_send,
    )
