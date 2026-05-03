"""
Airflow DAG: PostgreSQL -> Spark Extract -> S3 (Parquet) -> Spark Load -> ClickHouse

Pipeline:
  1. check_connections
  2. create_ch_tables
  3. extract_pg_to_s3
  4. validate_parquet
  5. load_s3_to_ch
  6. validate_ch
  7. cleanup_old_s3
  8. send_summary

Modes:
  - full load: no params
  - incremental: env INCREMENTAL_WATERMARK=2025-01-01
  - partial: env LOAD_TABLES=sales.orders,cart.cart

Schedule: daily at 02:00 UTC
Retry: 3 times with exponential backoff (5min, 15min, 45min)
"""

import os
from datetime import datetime, timedelta

import requests
import boto3
import psycopg2
import docker
import urllib.parse
from botocore.client import Config

from airflow import DAG
from airflow.operators.python import PythonOperator
import logging

SPARK_MASTER = os.getenv("SPARK_MASTER", "spark://spark-master:7077")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localstack:4566")
S3_BUCKET = os.getenv("S3_BUCKET", "etl-staging")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "test")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "test")

PG_HOST = os.getenv("PG_HOST", "retail_container")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DATABASE = os.getenv("PG_DATABASE", "omni_retail_core")
PG_USER = os.getenv("PG_USER", "admin")
PG_PASSWORD = os.getenv("PG_PASSWORD", "admin")

CH_HOST = os.getenv("CH_HOST", "clickhouse")
CH_PORT = int(os.getenv("CH_HTTP_PORT", "8123"))
CH_DATABASE = os.getenv("CH_DATABASE", "analytics")
CH_USER = os.getenv("CH_USER", "admin")
CH_PASSWORD = os.getenv("CH_PASSWORD", "admin")

SPARK_PACKAGES_EXTRACT = "org.postgresql:postgresql:42.7.1"
SPARK_PACKAGES_LOAD = "ru.yandex.clickhouse:clickhouse-jdbc:0.3.2-patch1,com.clickhouse:clickhouse-jdbc:0.4.6"
SPARK_JOBS_DIR = "/opt/spark/jobs"

DEFAULT_ARGS = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=45),
    "execution_timeout": timedelta(hours=2),
}


def _run_spark_job(script: str, packages: str, spark_conf: dict, env_vars: dict):
    """Execute spark-submit inside spark_master container via Docker API."""
    client = docker.from_env()
    container = client.containers.get("spark_master")

    spark_submit = "/opt/spark/bin/spark-submit"

    cmd_parts = [
        spark_submit,
        "--master", SPARK_MASTER,
        "--deploy-mode", "client",
    ]
    if packages:
        cmd_parts.extend(["--packages", packages])
    for k, v in spark_conf.items():
        cmd_parts.extend(["--conf", f"{k}={v}"])
    cmd_parts.append(f"{SPARK_JOBS_DIR}/{script}")

    env_exports = " ".join(f'{k}="{v}"' for k, v in env_vars.items())
    cmd = (
        f"export {env_exports}; "
        "mkdir -p /tmp/.ivy2/cache 2>/dev/null; "
    ) + " ".join(cmd_parts)

    logging.info(f"Running in spark_master: {cmd[:200]}...")

    exec_result = container.exec_run(
        cmd=["sh", "-c", cmd],
        demux=True,
    )

    exit_code = exec_result[0]
    stdout_data = exec_result[1][0] or b""
    stderr_data = exec_result[1][1] or b""

    for line in stdout_data.decode("utf-8", errors="replace").splitlines():
        logging.info(f"  SPARK: {line}")
    for line in stderr_data.decode("utf-8", errors="replace").splitlines():
        logging.warning(f"  SPARK: {line}")

    logging.info(f"spark-submit exit code: {exit_code}")

    if exit_code != 0:
        raise Exception(f"spark-submit failed with exit code {exit_code}")

    return exit_code


def _get_boto3_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )


def _get_pg_connection():
    return psycopg2.connect(
        host=PG_HOST, port=PG_PORT, database=PG_DATABASE,
        user=PG_USER, password=PG_PASSWORD,
    )


def _get_ch_connection():
    return f"http://{CH_HOST}:{CH_PORT}"


def check_connections(**context):
    """Check PostgreSQL, S3, ClickHouse connectivity."""
    logging.info("=" * 70)
    logging.info("CHECKING CONNECTIONS")
    logging.info("=" * 70)

    # PostgreSQL
    try:
        conn = _get_pg_connection()
        cur = conn.cursor()
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]
        logging.info(f"PostgreSQL OK: {version[:60]}")

        cur.execute("""
            SELECT table_schema, COUNT(*) as cnt
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
              AND table_schema NOT LIKE 'pg_%'
              AND table_schema != 'information_schema'
            GROUP BY table_schema
            ORDER BY table_schema
        """)
        schemas = cur.fetchall()
        for schema, cnt in schemas:
            logging.info(f"  Schema '{schema}': {cnt} tables")
        cur.close()
        conn.close()
    except Exception as e:
        logging.error(f"PostgreSQL FAILED: {e}")
        raise

    # S3 (LocalStack)
    try:
        s3 = _get_boto3_s3_client()
        try:
            s3.head_bucket(Bucket=S3_BUCKET)
            logging.info(f"S3 OK: bucket '{S3_BUCKET}' exists")
        except Exception:
            s3.create_bucket(Bucket=S3_BUCKET)
            logging.info(f"S3 OK: bucket '{S3_BUCKET}' created")
    except Exception as e:
        logging.error(f"S3 FAILED: {e}")
        raise

    # ClickHouse
    try:
        ch_url = _get_ch_connection()
        resp = requests.get(f"{ch_url}/?query=SELECT+version()", auth=(CH_USER, CH_PASSWORD))
        resp.raise_for_status()
        ch_version = resp.text.strip()
        logging.info(f"ClickHouse OK: {ch_version}")

        resp = requests.get(
            f"{ch_url}/?query=SELECT+name+FROM+system.databases+WHERE+name='{CH_DATABASE}'",
            auth=(CH_USER, CH_PASSWORD),
        )
        if CH_DATABASE not in resp.text:
            logging.warning(f"ClickHouse database '{CH_DATABASE}' does not exist, will create tables in default")
        else:
            logging.info(f"ClickHouse DB '{CH_DATABASE}' exists")
    except Exception as e:
        logging.error(f"ClickHouse FAILED: {e}")
        raise

    logging.info("=" * 70)
    logging.info("All connections OK")
    logging.info("=" * 70)


def create_clickhouse_tables(**context):
    """Create ClickHouse tables from DDL files."""
    ddl_dir = "/opt/spark/jobs/ddl"
    ddl_files = [
        "etl_stage2_tables.sql",
    ]

    ch_url = _get_ch_connection()
    auth = (CH_USER, CH_PASSWORD)

    for ddl_file in ddl_files:
        ddl_path = os.path.join(ddl_dir, ddl_file)
        if not os.path.exists(ddl_path):
            logging.warning(f"DDL file not found: {ddl_path}, skipping")
            continue

        logging.info(f"Executing DDL: {ddl_file}")
        with open(ddl_path, "r") as f:
            ddl_content = f.read()

        statements = [s.strip() for s in ddl_content.split(";") if s.strip()]
        for stmt in statements:
            lines = [l for l in stmt.split("\n") if l.strip() and not l.strip().startswith("--")]
            if not lines:
                continue

            full_stmt = "\n".join(lines)
            try:
                resp = requests.post(f"{ch_url}/", data=full_stmt.encode("utf-8"), auth=auth)
                if resp.status_code == 200:
                    logging.info(f"  OK: {full_stmt[:80]}...")
                else:
                    if "already exists" in resp.text.lower():
                        logging.info(f"  SKIP (exists): {full_stmt[:80]}...")
                    else:
                        logging.error(f"  FAIL: {resp.text}")
                        raise Exception(f"DDL execution failed: {resp.text}")
            except requests.ConnectionError:
                raise

    verify_query = f"SELECT database, name, engine FROM system.tables WHERE database='{CH_DATABASE}' ORDER BY name"
    resp = requests.post(
        f"{ch_url}/?query={urllib.parse.quote(verify_query)}",
        auth=auth,
    )
    resp.raise_for_status()
    tables = resp.text.strip().split("\n")
    logging.info(f"ClickHouse tables in '{CH_DATABASE}': {len(tables)}")
    for t in tables:
        logging.info(f"  {t}")


def validate_parquet(**context):
    """Verify Parquet files exist in S3."""
    s3 = _get_boto3_s3_client()
    snapshot_date = os.getenv("SNAPSHOT_DATE", datetime.now().strftime("%Y-%m-%d"))

    prefix = f"pg/"
    resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
    objects = resp.get("Contents", [])

    parquet_files = [o for o in objects if o["Key"].endswith(".parquet")]
    total_size = sum(o["Size"] for o in parquet_files)

    logging.info(f"Parquet files in S3: {len(parquet_files)}")
    logging.info(f"Total size: {total_size:,} bytes ({total_size / 1024 / 1024:.2f} MB)")
    for f in parquet_files:
        logging.info(f"  {f['Key']} — {f['Size']:,} bytes")

    if not parquet_files:
        raise Exception("No Parquet files found in S3 after extract!")

    ti = context["ti"]
    ti.xcom_push(key="parquet_count", value=len(parquet_files))
    ti.xcom_push(key="parquet_size", value=total_size)
    ti.xcom_push(key="parquet_files", value=[f["Key"] for f in parquet_files])


def validate_clickhouse(**context):
    """Verify ClickHouse load."""
    ch_url = _get_ch_connection()
    auth = (CH_USER, CH_PASSWORD)

    query = "SELECT database, name, total_rows, formatReadableSize(total_bytes) FROM system.tables WHERE database = 'analytics' ORDER BY total_rows DESC"
    resp = requests.post(f"{ch_url}/?query={urllib.parse.quote(query)}", auth=auth)
    resp.raise_for_status()
    lines = resp.text.strip().split("\n")

    logging.info(f"ClickHouse table stats:")
    for line in lines:
        logging.info(f"  {line}")


def cleanup_old_s3(**context):
    """Delete S3 partitions older than TTL (default 30 days)."""
    from datetime import datetime, timedelta, timezone

    s3 = _get_boto3_s3_client()
    retention_days = int(os.getenv("S3_RETENTION_DAYS", "30"))
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)

    resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="pg/")
    objects = resp.get("Contents", [])

    deleted = 0
    for obj in objects:
        last_mod = obj["LastModified"]
        if last_mod.tzinfo is None:
            last_mod = last_mod.replace(tzinfo=timezone.utc)
        if last_mod < cutoff:
            s3.delete_object(Bucket=S3_BUCKET, Key=obj["Key"])
            deleted += 1

    logging.info(f"Cleanup: deleted {deleted} objects older than {retention_days} days")


def send_summary(**context):
    """Log DAG execution summary."""
    ti = context["ti"]

    parquet_count = ti.xcom_pull(key="parquet_count", task_ids="validate_parquet") or 0
    parquet_size = ti.xcom_pull(key="parquet_size", task_ids="validate_parquet") or 0

    logging.info("=" * 70)
    logging.info("DAG EXECUTION SUMMARY")
    logging.info("=" * 70)
    logging.info(f"Execution date: {context['ds']}")
    logging.info(f"Mode: {'incremental' if os.getenv('INCREMENTAL_WATERMARK') else 'full load'}")
    logging.info(f"Parquet files: {parquet_count}")
    logging.info(f"Parquet size: {parquet_size:,} bytes ({parquet_size / 1024 / 1024:.2f} MB)")
    logging.info("=" * 70)


with DAG(
    dag_id="pg_spark_ch_etl",
    default_args=DEFAULT_ARGS,
    description="PostgreSQL -> Spark -> S3 (Parquet) -> Spark -> ClickHouse ETL",
    schedule_interval="0 2 * * *",
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["etl", "spark", "postgresql", "clickhouse", "s3"],
    max_active_runs=1,
    concurrency=1,
) as dag:

    t_check = PythonOperator(
        task_id="check_connections",
        python_callable=check_connections,
        doc_md="""\
### Проверка подключений

Проверяет соединение с PostgreSQL, ClickHouse и S3 (LocalStack).
Перечисляет схемы и таблицы PostgreSQL, проверяет наличие S3-бакета.
Убеждается, что целевая база ClickHouse доступна.
""",
    )

    t_ddl = PythonOperator(
        task_id="create_clickhouse_tables",
        python_callable=create_clickhouse_tables,
        doc_md="""\
### Создание таблиц в ClickHouse

Выполняет DDL-скрипты из `/opt/spark/jobs/ddl/etl_stage2_tables.sql`.
Создает целевые таблицы в ClickHouse для денормализованных данных.
Пропускает таблицы, которые уже существуют.
""",
    )

    def _task_extract(**context):
        _run_spark_job(
            script="extract_pg_to_s3.py",
            packages="",
            spark_conf={
                "spark.executor.instances": "2",
                "spark.executor.cores": "2",
                "spark.executor.memory": "1g",
                "spark.driver.memory": "512m",
            },
            env_vars={
                "PG_HOST": PG_HOST,
                "PG_PORT": str(PG_PORT),
                "PG_DATABASE": PG_DATABASE,
                "PG_USER": PG_USER,
                "PG_PASSWORD": PG_PASSWORD,
                "S3_ENDPOINT": S3_ENDPOINT,
                "S3_ACCESS_KEY": S3_ACCESS_KEY,
                "S3_SECRET_KEY": S3_SECRET_KEY,
                "S3_BUCKET": S3_BUCKET,
                "SNAPSHOT_DATE": context["ds"],
                "INCREMENTAL_WATERMARK": "",
            },
        )

    t_extract = PythonOperator(
        task_id="extract_pg_to_s3",
        python_callable=_task_extract,
        doc_md="""\
### Извлечение данных из PostgreSQL в S3

Запускает Spark-задачу `extract_pg_to_s3.py`, которая читает таблицы из PostgreSQL,
выполняет денормализующие JOIN-запросы и сохраняет результат в Parquet-файлы в S3
с партиционированием по дате снепшота.
""",
    )

    t_validate_parquet = PythonOperator(
        task_id="validate_parquet",
        python_callable=validate_parquet,
        doc_md="""\
### Проверка Parquet-файлов в S3

Подсчитывает количество Parquet-файлов и их общий размер в S3.
Завершается ошибкой, если после извлечения файлы не найдены.
""",
    )

    def _task_load(**context):
        _run_spark_job(
            script="load_s3_to_clickhouse.py",
            packages="",
            spark_conf={
                "spark.executor.instances": "2",
                "spark.executor.cores": "2",
                "spark.executor.memory": "1g",
                "spark.driver.memory": "512m",
                "spark.sql.adaptive.enabled": "true",
            },
            env_vars={
                "S3_ENDPOINT": S3_ENDPOINT,
                "S3_ACCESS_KEY": S3_ACCESS_KEY,
                "S3_SECRET_KEY": S3_SECRET_KEY,
                "S3_BUCKET": S3_BUCKET,
                "CH_HOST": CH_HOST,
                "CH_HTTP_PORT": str(CH_PORT),
                "CH_DATABASE": CH_DATABASE,
                "CH_USER": CH_USER,
                "CH_PASSWORD": CH_PASSWORD,
                "SNAPSHOT_DATE": context["ds"],
                "LOAD_TABLES": "",
            },
        )

    t_load = PythonOperator(
        task_id="load_s3_to_clickhouse",
        python_callable=_task_load,
        doc_md="""\
### Загрузка данных из S3 в ClickHouse

Запускает Spark-задачу `load_s3_to_clickhouse.py`, которая читает Parquet из S3,
конвертирует в CSV и отправляет INSERT-запросы через HTTP-интерфейс ClickHouse.
""",
    )

    t_validate_ch = PythonOperator(
        task_id="validate_clickhouse",
        python_callable=validate_clickhouse,
        doc_md="""\
### Проверка загрузки в ClickHouse

Запрашивает статистику по таблицам в базе analytics: количество строк и размер.
Позволяет убедиться, что данные загружены корректно.
""",
    )

    t_cleanup = PythonOperator(
        task_id="cleanup_old_s3",
        python_callable=cleanup_old_s3,
        trigger_rule="all_done",
        doc_md="""\
### Очистка старых файлов в S3

Удаляет Parquet-файлы старше заданного срока хранения (по умолчанию 30 дней).
Настраивается через переменную окружения `S3_RETENTION_DAYS`.
Выполняется всегда, независимо от результата предыдущих задач.
""",
    )

    t_summary = PythonOperator(
        task_id="send_summary",
        python_callable=send_summary,
        trigger_rule="all_done",
        doc_md="""\
### Итоговый отчёт

Выводит сводку выполнения DAG: режим работы, количество и размер Parquet-файлов.
Выполняется всегда, независимо от результата предыдущих задач.
""",
    )

    (
        t_check
        >> t_ddl
        >> t_extract
        >> t_validate_parquet
        >> t_load
        >> t_validate_ch
        >> t_cleanup
        >> t_summary
    )
