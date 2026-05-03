"""
Spark ETL — Load: LocalStack S3 (Parquet) → ClickHouse

Reads Parquet from S3 using Spark, converts to CSV, POSTs to ClickHouse HTTP API.
No JDBC needed — uses native ClickHouse HTTP interface with CSV format.
"""

import os
import sys
import io
import csv
import urllib.request
import urllib.parse
import base64
from datetime import date
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lit

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "config"))
from etl_config import (
    S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET,
    CH_HOST, CH_HTTP_PORT, CH_USER, CH_PASSWORD, CH_DATABASE,
    PG_TO_CH,
    s3_key,
)

DENORM_TABLES = {
    "catalog.products_denorm": "products",
    "core.users_denorm": "users",
    "catalog.inventory_denorm": "inventory",
    "feedback.reviews_denorm": "reviews",
    "sales.orders_flat": "orders_flat",
}


def build_spark_session() -> SparkSession:
    return (
        SparkSession.builder
        .appName("s3-to-clickhouse-load")
        .master(os.environ.get("SPARK_MASTER", "spark://spark-master:7077"))
        .config("spark.hadoop.fs.s3a.access.key", S3_ACCESS_KEY)
        .config("spark.hadoop.fs.s3a.secret.key", S3_SECRET_KEY)
        .config("spark.hadoop.fs.s3a.endpoint", S3_ENDPOINT)
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
        .config("spark.hadoop.fs.s3a.aws.credentials.provider",
                "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider")
        .getOrCreate()
    )


def read_s3_parquet(spark, schema: str, table: str, snapshot_date: str):
    key = s3_key(schema, table, snapshot_date)
    s3_path = f"s3a://{S3_BUCKET}/{key}"
    try:
        return spark.read.parquet(s3_path)
    except Exception as e:
        print(f"[WARN] No data at {s3_path}: {e}")
        return None


def read_denorm_parquet(spark, pg_table: str, snapshot_date: str):
    schema = pg_table.split(".")[0]
    alias = pg_table.split(".")[1]
    key = s3_key(schema, alias, snapshot_date)
    s3_path = f"s3a://{S3_BUCKET}/{key}"
    try:
        return spark.read.parquet(s3_path)
    except Exception as e:
        print(f"[WARN] No denorm data at {s3_path}: {e}")
        return None


def write_to_clickhouse_http(df, ch_table: str):
    """Write DataFrame to ClickHouse via HTTP API (CSV format)."""
    rows = df.collect()
    if not rows:
        print(f"  Empty DataFrame, skipping")
        return 0

    columns = df.columns
    schema = {f.name: str(f.dataType).lower() for f in df.schema.fields}

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(columns)
    for row in rows:
        row_data = []
        for i, val in enumerate(row):
            col_name = columns[i]
            col_type = schema.get(col_name, "")
            if val is None:
                row_data.append("")
            elif isinstance(val, bool):
                row_data.append("1" if val else "0")
            elif hasattr(val, "strftime"):
                # DateTime/Date — format without microseconds
                if hasattr(val, "microsecond") and val.microsecond:
                    row_data.append(val.strftime("%Y-%m-%d %H:%M:%S"))
                elif hasattr(val, "year"):
                    row_data.append(val.strftime("%Y-%m-%d"))
                else:
                    row_data.append(str(val))
            elif isinstance(val, (list, dict)):
                row_data.append(str(val))
            else:
                row_data.append(str(val))
        writer.writerow(row_data)

    csv_data = buffer.getvalue()
    buffer.close()

    # POST to ClickHouse HTTP using urllib
    query = f"INSERT INTO {CH_DATABASE}.{ch_table} FORMAT CSVWithNames"
    ch_url = f"http://{CH_HOST}:{CH_HTTP_PORT}/?query={urllib.parse.quote(query)}"

    auth_str = base64.b64encode(f"{CH_USER}:{CH_PASSWORD}".encode()).decode()

    req = urllib.request.Request(
        ch_url,
        data=csv_data.encode("utf-8"),
        headers={
            "Content-Type": "application/octet-stream",
            "Authorization": f"Basic {auth_str}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status != 200:
                raise Exception(f"HTTP {resp.status}: {resp.read().decode()}")
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else str(e)
        raise Exception(f"ClickHouse HTTP {e.code}: {body}")

    return len(rows)


def load_standard_tables(spark, snapshot_date: str, table_filter: list = None):
    """Load standard PG tables (1:1 mapping to ClickHouse)."""
    results = []
    for pg_table, ch_table in PG_TO_CH.items():
        if table_filter and pg_table not in table_filter:
            continue
        if pg_table in DENORM_TABLES:
            continue

        schema, table = pg_table.split(".")
        try:
            df = read_s3_parquet(spark, schema, table, snapshot_date)
            if df is None:
                print(f"[SKIP] {pg_table} — no parquet data")
                continue

            df = df.withColumn("snapshot_date", lit(snapshot_date).cast("date"))
            count = df.count()
            if count == 0:
                print(f"[SKIP] {pg_table} → {ch_table} — empty")
                continue

            print(f"[LOAD] {pg_table} → {ch_table} ({count} rows)")
            inserted = write_to_clickhouse_http(df, ch_table)
            print(f"[OK] {pg_table} → {ch_table} ({inserted} rows)")
            results.append({"pg_table": pg_table, "ch_table": ch_table, "rows": inserted, "mode": "standard"})
        except Exception as e:
            print(f"[FAIL] {pg_table} → {ch_table}: {e}")
            import traceback
            traceback.print_exc()
            results.append({"pg_table": pg_table, "ch_table": ch_table, "error": str(e), "mode": "standard"})
    return results


def load_denorm_tables(spark, snapshot_date: str, table_filter: list = None):
    """Load denormalized tables."""
    results = []
    for pg_table, ch_table in DENORM_TABLES.items():
        if table_filter and pg_table not in table_filter:
            continue

        try:
            df = read_denorm_parquet(spark, pg_table, snapshot_date)
            if df is None:
                print(f"[SKIP] {pg_table} — no parquet data")
                continue

            df = df.withColumn("snapshot_date", lit(snapshot_date).cast("date"))
            count = df.count()
            if count == 0:
                print(f"[SKIP] {pg_table} → {ch_table} — empty")
                continue

            print(f"[LOAD] {pg_table} → {ch_table} ({count} rows)")
            inserted = write_to_clickhouse_http(df, ch_table)
            print(f"[OK] {pg_table} → {ch_table} ({inserted} rows)")
            results.append({"pg_table": pg_table, "ch_table": ch_table, "rows": inserted, "mode": "denorm"})
        except Exception as e:
            print(f"[FAIL] {pg_table} → {ch_table}: {e}")
            import traceback
            traceback.print_exc()
            results.append({"pg_table": pg_table, "ch_table": ch_table, "error": str(e), "mode": "denorm"})
    return results


def main():
    spark = build_spark_session()
    spark.sparkContext.setLogLevel("INFO")

    snapshot_date = os.environ.get("SNAPSHOT_DATE", date.today().isoformat())
    table_filter_str = os.environ.get("LOAD_TABLES", "")
    table_filter = [t.strip() for t in table_filter_str.split(",") if t.strip()] if table_filter_str else None

    print(f"=" * 60)
    print(f"LOAD: S3 (LocalStack) → ClickHouse")
    print(f"Snapshot date: {snapshot_date}")
    print(f"Table filter: {table_filter or 'all'}")
    print(f"ClickHouse: {CH_HOST}:{CH_HTTP_PORT}/{CH_DATABASE}")
    print(f"=" * 60)

    all_results = []

    # 1. Standard tables
    print("\n--- LOAD STANDARD TABLES ---")
    all_results.extend(load_standard_tables(spark, snapshot_date, table_filter))

    # 2. Denormalized tables
    print("\n--- LOAD DENORMALIZED TABLES ---")
    all_results.extend(load_denorm_tables(spark, snapshot_date, table_filter))

    # Summary
    success = [r for r in all_results if "error" not in r]
    failed = [r for r in all_results if "error" in r]
    total_rows = sum(r.get("rows", 0) for r in success)

    print(f"\n{'=' * 60}")
    print(f"LOAD SUMMARY")
    print(f"  Total tables: {len(all_results)}")
    print(f"  Success: {len(success)}")
    print(f"  Failed: {len(failed)}")
    print(f"  Total rows inserted: {total_rows:,}")
    if failed:
        for f in failed:
            print(f"  FAIL: {f['pg_table']} → {f['ch_table']} — {f['error']}")
    print(f"{'=' * 60}")

    spark.stop()

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
