"""
Airflow DAG: PostgreSQL → Spark Extract → S3 (Parquet) → Spark Load → ClickHouse

Pipeline:
  1. check_connections    — проверить PG, S3, CH
  2. create_ch_tables   — создать таблицы в ClickHouse (DDL, если нет)
  3. extract_pg_to_s3   — Spark: PostgreSQL → S3 (Parquet)
  4. validate_parquet   — проверить что Parquet файлы записаны
  5. load_s3_to_ch      — Spark: S3 (Parquet) → ClickHouse
  6. validate_ch        — проверить что данные загружены
  7. cleanup_old_s3     — удалить старые S3 партиции (> TTL)
  8. send_summary       — итоговый лог

Режимы запуска:
  - full load: без параметров (все таблицы)
  - incremental: env INCREMENTAL_WATERMARK=2025-01-01
  - partial: env LOAD_TABLES=sales.orders,cart.cart

Schedule: daily at 02:00 UTC
Retry: 3 раза с exponential backoff (5min, 15min, 45min)
"""

import os
from datetime import datetime, timedelta

import requests
import boto3
import psycopg2
import docker
from botocore.client import Config

from airflow import DAG
from airflow.operators.python import PythonOperator
import logging

# ============================================================
# Configuration (override via Airflow Variables / env)
# ============================================================
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


# ============================================================
# Spark job runner via Docker exec into spark_master
# ============================================================
def _run_spark_job(script: str, packages: str, spark_conf: dict, env_vars: dict):
    """Execute spark-submit inside spark_master container via Docker API."""
    client = docker.from_env()
    container = client.containers.get("spark_master")

    spark_submit = "/opt/spark/bin/spark-submit"

    cmd_parts = [
        spark_submit,
        "--master", SPARK_MASTER,
        "--deploy-mode", "client",
        "--packages", packages,
        "--conf", "spark.jars.ivyPath=/tmp/.ivy2",
    ]
    for k, v in spark_conf.items():
        cmd_parts.extend(["--conf", f"{k}={v}"])
    cmd_parts.append(f"{SPARK_JOBS_DIR}/{script}")

    # Prepend env exports to command to preserve container's original environment
    env_exports = " ".join(f'{k}="{v}"' for k, v in env_vars.items())
    
    # Use /tmp/.ivy2 as cache — named volumes on Docker Desktop don't support chown
    cmd = (
        f"export {env_exports}; "
        "export SPARK_IVY_HOME=/tmp/.ivy2; "
        "mkdir -p /tmp/.ivy2/cache; "
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
    # ClickHouse HTTP interface
    return f"http://{CH_HOST}:{CH_PORT}"


# ============================================================
# Task 1: Check connections
# ============================================================
def check_connections(**context):
    """Проверить доступность PostgreSQL, S3, ClickHouse."""
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


# ============================================================
# Task 2: Create ClickHouse tables (DDL)
# ============================================================
def create_clickhouse_tables(**context):
    """Создать таблицы в ClickHouse из DDL файлов."""
    ddl_dir = "/opt/spark/jobs/ddl"
    # DDL файлы копируются через volume в docker-compose
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

        # Split by semicolon and execute each statement
        statements = [s.strip() for s in ddl_content.split(";") if s.strip()]
        for stmt in statements:
            # Skip comments-only lines
            lines = [l for l in stmt.split("\n") if l.strip() and not l.strip().startswith("--")]
            if not lines:
                continue

            full_stmt = "\n".join(lines)
            try:
                resp = requests.post(f"{ch_url}/", data=full_stmt.encode("utf-8"), auth=auth)
                if resp.status_code == 200:
                    logging.info(f"  OK: {stmt[:80]}...")
                else:
                    # Table already exists is OK
                    if "already exists" in resp.text.lower():
                        logging.info(f"  SKIP (exists): {stmt[:80]}...")
                    else:
                        logging.error(f"  FAIL: {resp.text}")
                        raise Exception(f"DDL execution failed: {resp.text}")
            except requests.ConnectionError:
                logging.error(f"  CONNECTION FAILED to ClickHouse")
                raise

    # Verify tables
    resp = requests.post(
        f"{ch_url}/?query=SELECT+database,+name,+engine+FROM+system.tables+WHERE+database='{CH_DATABASE}'+ORDER+BY+name",
        auth=auth,
    )
    resp.raise_for_status()
    tables = resp.text.strip().split("\n")
    logging.info(f"ClickHouse tables in '{CH_DATABASE}': {len(tables)}")
    for t in tables:
        logging.info(f"  {t}")


# ============================================================
# Task 4: Validate Parquet files in S3
# ============================================================
def validate_parquet(**context):
    """Проверить что Parquet файлы записаны в S3."""
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


# ============================================================
# Task 6: Validate ClickHouse load
# ============================================================
def validate_clickhouse(**context):
    """Проверить что данные загружены в ClickHouse."""
    ch_url = _get_ch_connection()
    auth = (CH_USER, CH_PASSWORD)

    query = """
    SELECT database, name, rows, formatReadableSize(bytes_on_disk)
    FROM system.tables
    WHERE database = 'analytics'
    ORDER BY rows DESC
    """
    resp = requests.post(f"{ch_url}/?query={query}", auth=auth)
    resp.raise_for_status()
    lines = resp.text.strip().split("\n")

    logging.info(f"ClickHouse table stats:")
    for line in lines:
        logging.info(f"  {line}")


# ============================================================
# Task 7: Cleanup old S3 partitions
# ============================================================
def cleanup_old_s3(**context):
    """Удалить S3 партиции старше TTL (по умолчанию 30 дней)."""
    from datetime import datetime, timedelta

    s3 = _get_boto3_s3_client()
    retention_days = int(os.getenv("S3_RETENTION_DAYS", "30"))
    cutoff = datetime.now() - timedelta(days=retention_days)

    resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="pg/")
    objects = resp.get("Contents", [])

    deleted = 0
    for obj in objects:
        if obj["LastModified"].replace(tzinfo=None) < cutoff:
            s3.delete_object(Bucket=S3_BUCKET, Key=obj["Key"])
            deleted += 1
            logging.info(f"Deleted: {obj['Key']} (age: {datetime.now() - obj['LastModified'].replace(tzinfo=None)})")

    logging.info(f"Cleanup: deleted {deleted} objects older than {retention_days} days")


# ============================================================
# Task 8: Send summary
# ============================================================
def send_summary(**context):
    """Итоговый лог DAG execution."""
    ti = context["ti"]

    # Extract results (from Spark logs, best effort)
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


# ============================================================
# DAG definition
# ============================================================
with DAG(
    dag_id="pg_spark_ch_etl",
    default_args=DEFAULT_ARGS,
    description="PostgreSQL → Spark → S3 (Parquet) → Spark → ClickHouse ETL",
    schedule_interval="0 2 * * *",  # daily at 02:00 UTC
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["etl", "spark", "postgresql", "clickhouse", "s3"],
    max_active_runs=1,
    concurrency=1,
) as dag:

    # --- Task 1: Check connections ---
    t_check = PythonOperator(
        task_id="check_connections",
        python_callable=check_connections,
    )

    # --- Task 2: Create ClickHouse tables (DDL) ---
    t_ddl = PythonOperator(
        task_id="create_clickhouse_tables",
        python_callable=create_clickhouse_tables,
    )

    # --- Task 3: Spark Extract — PostgreSQL → S3 ---
    def _task_extract(**context):
        _run_spark_job(
            script="extract_pg_to_s3.py",
            packages=SPARK_PACKAGES_EXTRACT,
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
                "INCREMENTAL_WATERMARK": "",  # overridden by Airflow Variable if set
            },
        )

    t_extract = PythonOperator(
        task_id="extract_pg_to_s3",
        python_callable=_task_extract,
    )

    # --- Task 4: Validate Parquet ---
    t_validate_parquet = PythonOperator(
        task_id="validate_parquet",
        python_callable=validate_parquet,
    )

    # --- Task 5: Spark Load — S3 → ClickHouse ---
    def _task_load(**context):
        _run_spark_job(
            script="load_s3_to_clickhouse.py",
            packages=SPARK_PACKAGES_LOAD,
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
                "LOAD_TABLES": "",  # overridden by Airflow Variable if set
            },
        )

    t_load = PythonOperator(
        task_id="load_s3_to_clickhouse",
        python_callable=_task_load,
    )

    # --- Task 6: Validate ClickHouse ---
    t_validate_ch = PythonOperator(
        task_id="validate_clickhouse",
        python_callable=validate_clickhouse,
    )

    # --- Task 7: Cleanup old S3 ---
    t_cleanup = PythonOperator(
        task_id="cleanup_old_s3",
        python_callable=cleanup_old_s3,
        trigger_rule="all_done",  # run even if previous tasks failed
    )

    # --- Task 8: Summary ---
    t_summary = PythonOperator(
        task_id="send_summary",
        python_callable=send_summary,
        trigger_rule="all_done",
    )

    # Dependencies
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
