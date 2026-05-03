"""
Airflow DAG: Data Quality & Business Analytics

Runs AFTER the main ETL DAG (pg_spark_ch_etl).
Performs 15+ data quality checks on ClickHouse analytics tables,
computes business metrics (revenue, retention, RFM, cohorts),
and stores results back in ClickHouse + S3 JSON reports.

No Spark needed -- all via ClickHouse SQL over HTTP API.

Schedule: daily at 04:00 UTC (after ETL at 02:00)
Retry: 2 times, 3 min delay
Depends on: pg_spark_ch_etl (via ExternalTaskSensor)
"""

import os
import json
import urllib.parse
from datetime import datetime, timedelta

import requests
import boto3
from botocore.client import Config

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.sensors.external_task import ExternalTaskSensor
import logging

CH_HOST = os.getenv("CH_HOST", "clickhouse")
CH_PORT = int(os.getenv("CH_HTTP_PORT", "8123"))
CH_DATABASE = os.getenv("CH_DATABASE", "analytics")
CH_USER = os.getenv("CH_USER", "admin")
CH_PASSWORD = os.getenv("CH_PASSWORD", "admin")

S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localstack:4566")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "test")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "test")
S3_BUCKET = os.getenv("S3_BUCKET", "etl-staging")

DEFAULT_ARGS = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=3),
    "execution_timeout": timedelta(minutes=30),
}


def _ch_url(query: str) -> str:
    base = f"http://{CH_HOST}:{CH_PORT}/"
    return f"{base}?query={urllib.parse.quote(query)}"


def _ch_post(query: str, data: bytes = None) -> str:
    auth = (CH_USER, CH_PASSWORD)
    resp = requests.post(_ch_url(query), auth=auth, data=data, timeout=30)
    resp.raise_for_status()
    return resp.text


def _ch_get(query: str) -> str:
    auth = (CH_USER, CH_PASSWORD)
    resp = requests.get(_ch_url(query), auth=auth, timeout=30)
    resp.raise_for_status()
    return resp.text


DQ_CHECKS = [
    ("users_null_email", "SELECT count() FROM analytics.users WHERE email = '' OR email IS NULL", 0),
    ("users_duplicate_email", "SELECT count() - uniq(email) FROM analytics.users WHERE email != ''", 200),
    ("products_null_name", "SELECT count() FROM analytics.products WHERE name = ''", 0),
    ("products_negative_price", "SELECT count() FROM analytics.products WHERE price < 0", 0),
    ("products_null_sku", "SELECT count() FROM analytics.products WHERE sku = ''", 0),
    ("orders_null_user", "SELECT count() FROM analytics.orders_flat WHERE user_id = 0", 100),  # some may be guest
    ("orders_negative_total", "SELECT count() FROM analytics.orders_flat WHERE total_amount < 0", 0),
    ("orders_null_date", "SELECT count() FROM analytics.orders_flat WHERE order_date = '1970-01-01'", 0),
    ("reviews_invalid_rating", "SELECT count() FROM analytics.reviews WHERE rating < 1 OR rating > 5", 0),
    ("reviews_null_content", "SELECT count() FROM analytics.reviews WHERE content = ''", 0),
    ("orphan_cart_items", """
        SELECT count() FROM analytics.cart_items ci
        LEFT JOIN analytics.products p ON ci.product_id = p.id
        WHERE p.id = 0 AND ci.product_id != 0
    """, 0),
    ("orphan_order_items", """
        SELECT count() FROM analytics.orders_flat of2
        LEFT JOIN analytics.products p ON of2.product_id = p.id
        WHERE p.id = 0 AND of2.product_id != 0
    """, 0),
    ("inventory_negative_qty", "SELECT count() FROM analytics.inventory WHERE quantity_available < 0 OR quantity_reserved < 0", 0),
    ("future_orders", "SELECT count() FROM analytics.orders_flat WHERE order_date > today() + 1", 0),
    ("stale_carts", "SELECT count() FROM analytics.carts WHERE updated_at < now() - INTERVAL 180 DAY", 1000),
]


def run_data_quality_checks(**context):
    results = []
    failed = []

    for check_name, query, threshold in DQ_CHECKS:
        try:
            result = _ch_get(query).strip()
            # Parse numeric result
            try:
                violation_count = int(float(result))
            except (ValueError, TypeError):
                violation_count = -1

            status = "PASS" if violation_count <= threshold else "FAIL"
            result_obj = {
                "check": check_name,
                "violations": violation_count,
                "threshold": threshold,
                "status": status,
            }
            results.append(result_obj)
            logging.info(f"DQ [{status}] {check_name}: {violation_count} violations (threshold: {threshold})")

            if status == "FAIL":
                failed.append(check_name)

        except Exception as e:
            result_obj = {
                "check": check_name,
                "violations": -1,
                "threshold": threshold,
                "status": "ERROR",
                "error": str(e),
            }
            results.append(result_obj)
            logging.error(f"DQ [ERROR] {check_name}: {e}")
            failed.append(check_name)

    # Summary
    passed = len([r for r in results if r["status"] == "PASS"])
    total = len(results)
    score = round(passed / total * 100, 1) if total > 0 else 0

    summary = {
        "run_date": datetime.now().isoformat(),
        "total_checks": total,
        "passed": passed,
        "failed": len(failed),
        "errors": len([r for r in results if r["status"] == "ERROR"]),
        "quality_score": score,
        "details": results,
    }

    logging.info(f"DQ Summary: {passed}/{total} passed, score={score}%")
    if failed:
        logging.warning(f"Failed checks: {', '.join(failed)}")

    ti = context["ti"]
    ti.xcom_push(key="dq_summary", value=summary)
    ti.xcom_push(key="dq_score", value=score)

    _create_dq_results_table()
    for r in results:
        _insert_dq_result(r, context["ds"])

    return summary


def _create_dq_results_table():
    _ch_post("""
        CREATE TABLE IF NOT EXISTS analytics.dq_results
        (
            run_date Date,
            check_name LowCardinality(String),
            violations Int64,
            threshold Int64,
            status LowCardinality(String),
            error Nullable(String),
            created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(run_date)
        ORDER BY (run_date, check_name)
        TTL run_date + INTERVAL 90 DAY
        SETTINGS index_granularity = 8192
    """)


def _insert_dq_result(result: dict, run_date: str):
    row = {
        "run_date": run_date,
        "check_name": result["check"],
        "violations": result["violations"],
        "threshold": result["threshold"],
        "status": result["status"],
    }
    if result.get("error"):
        row["error"] = result["error"]
    _ch_post(
        f"INSERT INTO {CH_DATABASE}.dq_results FORMAT JSONEachRow",
        data=json.dumps(row).encode("utf-8"),
    )


BUSINESS_METRICS_QUERIES = {
    "daily_revenue": """
        SELECT
            toStartOfWeek(order_date) AS week,
            count() AS orders,
            sum(total_amount) AS revenue,
            uniq(user_id) AS customers,
            avg(total_amount) AS avg_order_value
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 90 DAY
        GROUP BY week
        ORDER BY week
        FORMAT JSONEachRow
    """,
    "top_products": """
        SELECT
            product_name,
            product_category,
            sum(quantity) AS units_sold,
            sum(item_total) AS revenue,
            count() AS order_count
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 30 DAY
        GROUP BY product_name, product_category
        ORDER BY revenue DESC
        LIMIT 20
        FORMAT JSONEachRow
    """,
    "top_categories": """
        SELECT
            product_category,
            count() AS orders,
            sum(item_total) AS revenue,
            uniq(user_id) AS customers,
            avg(item_total) AS avg_item_value
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 90 DAY
        GROUP BY product_category
        ORDER BY revenue DESC
        FORMAT JSONEachRow
    """,
    "payment_methods": """
        SELECT
            payment_method,
            count() AS orders,
            sum(total_amount) AS revenue,
            round(avg(total_amount), 2) AS avg_order_value
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 90 DAY
        GROUP BY payment_method
        ORDER BY revenue DESC
        FORMAT JSONEachRow
    """,
    "device_distribution": """
        SELECT
            device_type,
            count() AS orders,
            sum(total_amount) AS revenue,
            round(avg(total_amount), 2) AS avg_order_value
        FROM analytics.orders_flat
        WHERE order_date >= today() - INTERVAL 90 DAY
        GROUP BY device_type
        ORDER BY revenue DESC
        FORMAT JSONEachRow
    """,
    "cohort_retention": """
        SELECT
            toYYYYMM(first_order) AS cohort_month,
            months_since_first,
            count(DISTINCT user_id) AS active_users,
            count() AS orders,
            sum(total_amount) AS revenue
        FROM (
            SELECT
                user_id,
                min(order_date) AS first_order,
                dateDiff('month', min(order_date) OVER (PARTITION BY user_id), order_date) AS months_since_first,
                order_date,
                total_amount
            FROM analytics.orders_flat
        )
        WHERE first_order >= today() - INTERVAL 365 DAY
        GROUP BY cohort_month, months_since_first
        ORDER BY cohort_month, months_since_first
        FORMAT JSONEachRow
    """,
    "reviews_summary": """
        SELECT
            toStartOfWeek(created_at) AS week,
            count() AS review_count,
            avg(rating) AS avg_rating,
            sum(CASE WHEN verified_purchase THEN 1 ELSE 0 END) AS verified_count,
            sum(CASE WHEN visible THEN 1 ELSE 0 END) AS visible_count
        FROM analytics.reviews
        WHERE created_at >= now() - INTERVAL 90 DAY
        GROUP BY week
        ORDER BY week
        FORMAT JSONEachRow
    """,
    "inventory_alerts": """
        SELECT
            warehouse_name,
            product_name,
            quantity_available,
            quantity_reserved,
            min_stock_level,
            reorder_point
        FROM analytics.inventory
        WHERE quantity_available < min_stock_level
           OR (reorder_point IS NOT NULL AND quantity_available + quantity_reserved < reorder_point)
        FORMAT JSONEachRow
    """,
}


def compute_business_metrics(**context):
    results = {}
    snapshot_date = context["ds"]

    for metric_name, query in BUSINESS_METRICS_QUERIES.items():
        try:
            result_text = _ch_get(query)
            rows = []
            for line in result_text.strip().split("\n"):
                if line.strip():
                    try:
                        rows.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue

            results[metric_name] = rows
            logging.info(f"Metrics [{metric_name}]: {len(rows)} rows")

        except Exception as e:
            results[metric_name] = []
            logging.error(f"Metrics [{metric_name}] FAILED: {e}")

    ti = context["ti"]
    ti.xcom_push(key="business_metrics", value=results)

    _create_metrics_summary_table()
    summary_rows = []
    for metric_name, rows in results.items():
        summary_rows.append({
            "run_date": snapshot_date,
            "metric_name": metric_name,
            "row_count": len(rows),
            "status": "success" if rows else "empty_or_failed",
        })

    if summary_rows:
        rows_json = []
        for r in summary_rows:
            rows_json.append(json.dumps({
                "run_date": r["run_date"],
                "metric_name": r["metric_name"],
                "row_count": r["row_count"],
                "status": r["status"],
            }))
        _ch_post(
            f"INSERT INTO {CH_DATABASE}.metrics_summary FORMAT JSONEachRow",
            data="\n".join(rows_json).encode("utf-8"),
        )

    return results


def _create_metrics_summary_table():
    _ch_post("""
        CREATE TABLE IF NOT EXISTS analytics.metrics_summary
        (
            run_date Date,
            metric_name LowCardinality(String),
            row_count UInt64,
            status LowCardinality(String),
            created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(run_date)
        ORDER BY (run_date, metric_name)
        TTL run_date + INTERVAL 90 DAY
        SETTINGS index_granularity = 8192
    """)


def export_reports_to_s3(**context):
    ti = context["ti"]
    dq_summary = ti.xcom_pull(key="dq_summary", task_ids="data_quality_checks") or {}
    business_metrics = ti.xcom_pull(key="business_metrics", task_ids="business_metrics") or {}
    snapshot_date = context["ds"]

    report = {
        "run_date": snapshot_date,
        "generated_at": datetime.now().isoformat(),
        "data_quality": dq_summary,
        "business_metrics": {
            k: {"row_count": len(v), "sample": v[:5]}  # first 5 rows only
            for k, v in business_metrics.items()
        },
    }

    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )

    try:
        s3.head_bucket(Bucket=S3_BUCKET)
    except Exception:
        s3.create_bucket(Bucket=S3_BUCKET)

    key = f"reports/daily/{snapshot_date}/analytics_report.json"
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(report, indent=2, ensure_ascii=False, default=str).encode("utf-8"),
        ContentType="application/json",
    )
    logging.info(f"Report uploaded: s3://{S3_BUCKET}/{key}")

    for metric_name, rows in business_metrics.items():
        if rows:
            metric_key = f"reports/daily/{snapshot_date}/{metric_name}.json"
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=metric_key,
                Body=json.dumps(rows, indent=2, ensure_ascii=False, default=str).encode("utf-8"),
                ContentType="application/json",
            )
            logging.info(f"Metric uploaded: s3://{S3_BUCKET}/{metric_key}")


def final_summary(**context):
    ti = context["ti"]
    dq_summary = ti.xcom_pull(key="dq_summary", task_ids="data_quality_checks") or {}
    business_metrics = ti.xcom_pull(key="business_metrics", task_ids="business_metrics") or {}

    logging.info("=" * 70)
    logging.info("DATA QUALITY & ANALYTICS — FINAL SUMMARY")
    logging.info("=" * 70)
    logging.info(f"Run date: {context['ds']}")
    logging.info(f"DQ Score: {dq_summary.get('quality_score', 'N/A')}%")
    logging.info(f"DQ Checks: {dq_summary.get('passed', 0)}/{dq_summary.get('total_checks', 0)} passed")
    logging.info(f"Business metrics computed: {len(business_metrics)}")
    for name, rows in business_metrics.items():
        logging.info(f"  {name}: {len(rows)} rows")
    logging.info("=" * 70)


with DAG(
    dag_id="data_quality_and_analytics",
    default_args=DEFAULT_ARGS,
    description="Data Quality checks + Business Metrics + S3 Reports",
    schedule_interval="0 4 * * *",  # daily at 04:00 UTC
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["data-quality", "analytics", "reporting", "clickhouse"],
    max_active_runs=1,
) as dag:

    t_wait = ExternalTaskSensor(
        task_id="wait_for_etl_dag",
        external_dag_id="pg_spark_ch_etl",
        external_task_id=None,
        allowed_states=["success"],
        execution_delta=timedelta(hours=2),
        timeout=3600,
        poke_interval=60,
        mode="reschedule",
        doc_md="""\
### Ожидание завершения ETL

Датчик, который ждёт успешного завершения DAG `pg_spark_ch_etl`.
Проверяет каждые 60 секунд, таймаут 1 час.
Гарантирует, что аналитика запускается только после обновления данных.
""",
    )

    t_dq = PythonOperator(
        task_id="data_quality_checks",
        python_callable=run_data_quality_checks,
        doc_md="""\
### Проверки качества данных

Выполняет 15 проверок качества данных в ClickHouse:
- NULL и дубликаты в ключевых полях (email, name, SKU)
- Отрицательные значения (цены, итоги заказов, остатки)
- Ошибочные рейтинги (1-5), orphan-записи
- Заказы из будущего, старые корзины

Результаты сохраняются в таблицу `dq_results` и XCom.
""",
    )

    t_metrics = PythonOperator(
        task_id="business_metrics",
        python_callable=compute_business_metrics,
        doc_md="""\
### Расчёт бизнес-метрик

Вычисляет 8 бизнес-метрик через SQL-запросы к ClickHouse:
- Ежедневная выручка и средний чек
- Топ-20 продуктов и категории
- Распределение по способам оплаты и устройствам
- Когортная модель удержания клиентов
- Сводка отзывов и алерты по остаткам

Результаты сохраняются в таблицу `metrics_summary`.
""",
    )

    t_export = PythonOperator(
        task_id="export_reports_to_s3",
        python_callable=export_reports_to_s3,
        doc_md="""\
### Экспорт отчётов в S3

Формирует единый JSON-отчёт с результатами проверок качества и бизнес-метрик.
Сохраняет общий отчёт и отдельные файлы по каждой метрике в S3.
Путь: `reports/daily/{date}/analytics_report.json`.
""",
    )

    t_summary = PythonOperator(
        task_id="final_summary",
        python_callable=final_summary,
        trigger_rule="all_done",
        doc_md="""\
### Итоговый отчёт

Выводит сводку: score качества, количество пройденных проверок,
число строк по каждой бизнес-метрике.
Выполняется всегда, независимо от результата предыдущих задач.
""",
    )

    t_wait >> t_dq >> t_metrics >> t_export >> t_summary
