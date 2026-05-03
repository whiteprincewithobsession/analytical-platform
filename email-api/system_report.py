"""
System Report Module — Infrastructure health & statistics

Collects metrics from all services (PostgreSQL, ClickHouse, Airflow,
Spark, Kafka, LocalStack) and sends a formatted email report.

Usage:
    curl -X POST http://localhost:5555/system-report \
      -H "Content-Type: application/json" \
      -d '{"recipients": ["user@mail.ru"]}'
"""

import os
import re
import json
import time
import logging
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
from flask import Blueprint, request, jsonify

logger = logging.getLogger(__name__)

system_bp = Blueprint("system_report", __name__)

# ─── Config ──────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.mail.ru").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "stratum-platform@mail.ru").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_MAIL_FROM = os.getenv("SMTP_MAIL_FROM", SMTP_USER).strip()

DEFAULT_RECIPIENTS = os.getenv(
    "REPORT_RECIPIENTS",
    "yarik_02022005@mail.ru,yastremskiy_2014@mail.ru,yarik02022005@mail.ru"
).split(",")
DEFAULT_RECIPIENTS = [r.strip() for r in DEFAULT_RECIPIENTS if r.strip()]

# Service URLs
CH_HOST = os.getenv("CH_HOST", "clickhouse").strip()
CH_PORT = os.getenv("CH_HTTP_PORT", "8123")
CH_USER = os.getenv("CH_USER", "admin")
CH_PASSWORD = os.getenv("CH_PASSWORD", "admin")

PG_HOST = os.getenv("PG_HOST", "retail_container").strip()
PG_PORT = os.getenv("PG_PORT", "5432")
PG_USER = os.getenv("PG_USER", "admin")
PG_PASSWORD = os.getenv("PG_PASSWORD", "admin")
PG_DB = os.getenv("PG_DATABASE", "omni_retail_core")

AIRFLOW_URL = os.getenv("AIRFLOW_URL", "http://airflow_webserver:8080")
AIRFLOW_USER = os.getenv("AIRFLOW_USER", "admin")
AIRFLOW_PASSWORD = os.getenv("AIRFLOW_PASSWORD", "admin")

SPARK_MASTER_URL = os.getenv("SPARK_MASTER_URL", "http://spark-master:8080")
KAFKA_UI_URL = os.getenv("KAFKA_UI_URL", "http://kafka-ui:8090")
LOCALSTACK_URL = os.getenv("LOCALSTACK_URL", "http://localstack:4566")
FLINK_URL = os.getenv("FLINK_URL", "http://flink-jobmanager:8084")
SUPERSET_URL = os.getenv("SUPERSET_URL", "http://superset:8088")


# ─── Service collectors ──────────────────────────────────

def _ch_query(query: str) -> str:
    """Execute ClickHouse query via HTTP."""
    ch_url = f"http://{CH_HOST}:{CH_PORT}/?query={requests.utils.quote(query)}"
    resp = requests.get(ch_url, auth=(CH_USER, CH_PASSWORD), timeout=15)
    resp.raise_for_status()
    return resp.text.strip()


def check_clickhouse():
    """Collect ClickHouse stats."""
    status = {"service": "ClickHouse", "status": "unknown", "details": {}}
    try:
        version = _ch_query("SELECT version()")
        status["status"] = "healthy"
        status["version"] = version

        databases = _ch_query("SELECT name FROM system.databases ORDER BY name")
        status["details"]["databases"] = [d for d in databases.split("\n") if d]

        tables = _ch_query(
            f"SELECT database, name, total_rows, formatReadableSize(total_bytes) "
            f"FROM system.tables WHERE database = 'analytics' ORDER BY total_rows DESC"
        )
        table_rows = []
        for line in tables.split("\n"):
            parts = line.split("\t")
            if len(parts) >= 3:
                table_rows.append({"name": parts[1], "rows": parts[2], "size": parts[3] if len(parts) > 3 else "0 B"})
        status["details"]["tables"] = table_rows[:15]  # top 15
        status["details"]["total_tables"] = len(table_rows)

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


def check_postgresql():
    """Collect PostgreSQL stats."""
    status = {"service": "PostgreSQL", "status": "unknown", "details": {}}
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=PG_HOST, port=PG_PORT, database=PG_DB,
            user=PG_USER, password=PG_PASSWORD,
        )
        cur = conn.cursor()

        cur.execute("SELECT version()")
        status["version"] = cur.fetchone()[0][:60]

        cur.execute("SELECT count(*) FROM pg_stat_activity")
        status["details"]["active_connections"] = cur.fetchone()[0]

        cur.execute("""
            SELECT schemaname, count(*) FROM pg_stat_user_tables
            GROUP BY schemaname ORDER BY count(*) DESC
        """)
        schema_tables = dict(cur.fetchall())
        status["details"]["tables_by_schema"] = schema_tables

        cur.execute("""
            SELECT pg_size_pretty(pg_database_size(%s))
        """, (PG_DB,))
        status["details"]["db_size"] = cur.fetchone()[0]

        cur.execute("""
            SELECT count(*) FROM pg_stat_activity
            WHERE state = 'active' AND pid != pg_backend_pid()
        """)
        status["details"]["active_queries"] = cur.fetchone()[0]

        conn.close()
        status["status"] = "healthy"

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


def check_airflow():
    """Collect Airflow stats."""
    status = {"service": "Apache Airflow", "status": "unknown", "details": {}}
    try:
        session = requests.Session()
        login_url = f"{AIRFLOW_URL}/login/"
        r = session.get(login_url, timeout=10)
        csrf = re.search(r'name="csrf_token"\s+value="([^"]+)"', r.text)
        csrf_token = csrf.group(1) if csrf else ""
        session.post(login_url, data={
            "username": AIRFLOW_USER,
            "password": AIRFLOW_PASSWORD,
            "csrf_token": csrf_token,
        }, timeout=10)

        r = session.get(f"{AIRFLOW_URL}/health", timeout=10)
        health = r.json()
        status["status"] = "healthy"
        status["details"]["scheduler"] = health.get("scheduler", {}).get("status", "unknown")
        status["details"]["triggerer"] = health.get("triggerer", {}).get("status", "unknown")
        status["details"]["metadatabase"] = health.get("metadatabase", {}).get("status", "unknown")

        # List DAGs
        r = session.get(f"{AIRFLOW_URL}/api/v1/dags", timeout=10)
        if r.status_code == 200:
            dags = r.json().get("dags", [])
            status["details"]["dag_count"] = len(dags)
            status["details"]["dags"] = [
                {"dag_id": d["dag_id"], "is_paused": d["is_paused"], "schedule_interval": d.get("schedule_interval", "")}
                for d in dags
            ]

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


def check_spark():
    """Collect Spark stats."""
    status = {"service": "Apache Spark", "status": "unknown", "details": {}}
    try:
        r = requests.get(SPARK_MASTER_URL, timeout=10)
        if r.status_code == 200:
            status["status"] = "healthy"
            # Parse workers from HTML
            workers = re.findall(r'<td>(\d+\.\d+\.\d+\.\d+:\d+)</td>\s*<td>ALIVE</td>', r.text)
            status["details"]["alive_workers"] = len(workers)
            status["details"]["workers"] = workers

            # Apps
            apps = re.findall(r'<strong>(app-[^<]+)</strong>', r.text)
            status["details"]["running_apps"] = len(apps)
        else:
            status["status"] = "unreachable"

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


def check_kafka():
    """Collect Kafka stats via Kafka UI."""
    status = {"service": "Apache Kafka", "status": "unknown", "details": {}}
    try:
        r = requests.get(f"{KAFKA_UI_URL}/api/clusters", timeout=10)
        if r.status_code == 200:
            clusters = r.json()
            status["status"] = "healthy"
            status["details"]["clusters"] = len(clusters)

            for cluster in clusters:
                cluster_id = cluster.get("id", "")
                topics_r = requests.get(
                    f"{KAFKA_UI_URL}/api/clusters/{cluster_id}/topics", timeout=10
                )
                if topics_r.status_code == 200:
                    topics = topics_r.json()
                    status["details"]["topic_count"] = len(topics)
                    status["details"]["topics"] = [
                        {"name": t["name"], "partitions": t["partitionCount"]}
                        for t in topics[:10]
                    ]
        else:
            status["status"] = "unreachable"

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


def check_flink():
    """Collect Flink stats."""
    status = {"service": "Apache Flink", "status": "unknown", "details": {}}
    try:
        r = requests.get(f"{FLINK_URL}/overview", timeout=10)
        if r.status_code == 200:
            data = r.json()
            status["status"] = "healthy"
            status["details"]["taskmanagers"] = data.get("taskmanagers", 0)
            status["details"]["slots_total"] = data.get("slots-total", 0)
            status["details"]["slots_available"] = data.get("slots-available", 0)
            status["details"]["jobs_running"] = data.get("jobs-running", 0)
            status["details"]["jobs_finished"] = data.get("jobs-finished", 0)
        else:
            status["status"] = "unreachable"

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


def check_localstack():
    """Collect LocalStack (S3) stats."""
    status = {"service": "LocalStack (S3)", "status": "unknown", "details": {}}
    try:
        import boto3
        from botocore.client import Config
        s3 = boto3.client(
            "s3",
            endpoint_url=LOCALSTACK_URL,
            aws_access_key_id="test",
            aws_secret_access_key="test",
            region_name="us-east-1",
            config=Config(signature_version="s3v4"),
        )
        buckets = s3.list_buckets()["Buckets"]
        status["status"] = "healthy"
        status["details"]["bucket_count"] = len(buckets)
        status["details"]["buckets"] = []

        for b in buckets:
            resp = s3.list_objects_v2(Bucket=b["Name"])
            obj_count = resp.get("KeyCount", 0)
            total_size = sum(o.get("Size", 0) for o in resp.get("Contents", []))
            status["details"]["buckets"].append({
                "name": b["Name"],
                "objects": obj_count,
                "size_bytes": total_size,
            })

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


def check_superset():
    """Collect Superset stats."""
    status = {"service": "Apache Superset", "status": "unknown", "details": {}}
    try:
        session = requests.Session()
        r = session.get(f"{SUPERSET_URL}/login/", timeout=10)
        csrf = re.search(r'name="csrf_token"\s+value="([^"]+)"', r.text)
        csrf_token = csrf.group(1) if csrf else ""
        session.post(f"{SUPERSET_URL}/login/", data={
            "username": "admin",
            "password": "admin",
            "csrf_token": csrf_token,
        }, timeout=10)

        r = session.get(f"{SUPERSET_URL}/api/v1/dashboard/", timeout=10)
        if r.status_code == 200:
            dashboards = r.json().get("result", [])
            status["status"] = "healthy"
            status["details"]["dashboard_count"] = len(dashboards)
            status["details"]["dashboards"] = [
                {"id": d["id"], "title": d["dashboard_title"]}
                for d in dashboards
            ]

    except Exception as e:
        status["status"] = "error"
        status["error"] = str(e)
    return status


# ─── HTML email template ─────────────────────────────────

def _build_html_report(services: list, run_time: str):
    """Build HTML email body."""

    def status_badge(s):
        if s == "healthy":
            return '<span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">HEALTHY</span>'
        elif s == "error":
            return '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">ERROR</span>'
        else:
            return '<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">UNKNOWN</span>'

    services_html = ""
    for svc in services:
        name = svc.get("service", "Unknown")
        status = svc.get("status", "unknown")
        version = svc.get("version", "")
        error = svc.get("error", "")
        details = svc.get("details", {})

        details_html = ""
        for k, v in details.items():
            if isinstance(v, list):
                items_str = ", ".join(str(x) for x in v[:5])
                details_html += f'<tr><td style="padding:4px 8px;color:#6b7280;">{k}</td><td style="padding:4px 8px;">{items_str}{"..." if len(v) > 5 else ""}</td></tr>'
            elif isinstance(v, dict):
                dict_str = json.dumps(v, ensure_ascii=False, default=str)[:100]
                details_html += f'<tr><td style="padding:4px 8px;color:#6b7280;">{k}</td><td style="padding:4px 8px;">{dict_str}</td></tr>'
            else:
                details_html += f'<tr><td style="padding:4px 8px;color:#6b7280;">{k}</td><td style="padding:4px 8px;">{v}</td></tr>'

        error_html = f'<tr><td colspan="2" style="padding:4px 8px;color:#ef4444;">Error: {error}</td></tr>' if error else ""
        version_html = f'<span style="color:#6b7280;font-size:12px;">{version}</span>' if version else ""

        services_html += f"""
        <tr><td colspan="2" style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
            <div style="display:flex;align-items:center;gap:8px;">
                <strong style="font-size:16px;">{name}</strong> {version_html} {status_badge(status)}
            </div>
            <table style="width:100%;margin-top:8px;font-size:13px;">
                {error_html}
                {details_html}
            </table>
        </td></tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
<tr><td align="center">
<table role="presentation" width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:30px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">📊 Marketplace Analytics</h1>
    <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">System Infrastructure Report</p>
</td></tr>

<!-- Summary -->
<tr><td style="padding:20px 24px;">
    <h2 style="margin:0 0 8px;color:#111;font-size:18px;">Состояние сервисов</h2>
    <p style="margin:0;color:#6b7280;font-size:13px;">Сформировано: {run_time}</p>
</td></tr>

<!-- Services -->
<tr><td style="padding:0 24px 24px;">
    <table style="width:100%;font-size:14px;">
        {services_html}
    </table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f9fafb;padding:16px 24px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
    Автоматический отчёт • Marketplace Analytics Platform
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    return html


def _send_system_report_email(recipients: list, services: list, run_time: str):
    """Send system report email."""
    html_body = _build_html_report(services, run_time)

    healthy_count = len([s for s in services if s.get("status") == "healthy"])
    total_count = len(services)

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_MAIL_FROM
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = f"System Report: {healthy_count}/{total_count} services healthy — {run_time}"
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
    server.starttls()
    server.login(SMTP_USER, SMTP_PASSWORD)
    server.sendmail(SMTP_MAIL_FROM, recipients, msg.as_string())
    server.quit()
    logger.info(f"System report sent to {recipients}")


# ─── Routes ──────────────────────────────────────────────

@system_bp.route("/system-report", methods=["POST"])
def system_report():
    """Collect system stats from all services and email the report."""
    data = request.get_json(silent=True) or {}

    # Recipients: from request → env default → hardcoded fallback
    recipients = data.get("recipients", [])
    if not recipients:
        recipients = DEFAULT_RECIPIENTS[:]

    # Validate emails
    for r in recipients:
        if "@" not in r or "." not in r.split("@")[-1]:
            return jsonify({"error": f"Invalid email: {r}"}), 400

    timeout = data.get("timeout", 60)  # per-service timeout in seconds
    parallel = data.get("parallel", True)

    run_time = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    logger.info(f"System report requested for {recipients}")

    collectors = [
        check_clickhouse,
        check_postgresql,
        check_airflow,
        check_spark,
        check_kafka,
        check_flink,
        check_localstack,
        check_superset,
    ]

    services = []

    if parallel:
        from concurrent.futures import ThreadPoolExecutor, as_completed
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {executor.submit(c): c.__name__ for c in collectors}
            for future in as_completed(futures, timeout=timeout):
                try:
                    services.append(future.result())
                except Exception as e:
                    services.append({
                        "service": futures[future],
                        "status": "error",
                        "error": str(e),
                        "details": {},
                    })
    else:
        for collector in collectors:
            try:
                services.append(collector())
            except Exception as e:
                services.append({
                    "service": collector.__name__,
                    "status": "error",
                    "error": str(e),
                    "details": {},
                })

    # Sort: healthy first, then errors
    services.sort(key=lambda s: 0 if s["status"] == "healthy" else 1)

    # Send email
    try:
        _send_system_report_email(recipients, services, run_time)
        email_sent = True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        email_sent = False

    return jsonify({
        "success": True,
        "run_time": run_time,
        "services": services,
        "recipients": recipients,
        "email_sent": email_sent,
    })


@system_bp.route("/system-report/preview", methods=["GET"])
def system_report_preview():
    """Preview HTML report without sending email."""
    services = []
    for collector in [
        check_clickhouse, check_postgresql, check_airflow,
        check_spark, check_kafka, check_flink, check_localstack, check_superset,
    ]:
        try:
            services.append(collector())
        except Exception as e:
            services.append({"service": collector.__name__, "status": "error", "error": str(e), "details": {}})

    services.sort(key=lambda s: 0 if s["status"] == "healthy" else 1)
    run_time = datetime.now().strftime("%d.%m.%Y %H:%M:%S")

    html = _build_html_report(services, run_time)
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}
