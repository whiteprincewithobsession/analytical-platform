"""
Spark ETL — Load: LocalStack S3 (Parquet) → ClickHouse

Usage (via spark-submit):
    spark-submit \
      --master spark://spark-master:7077 \
      --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1 \
      --conf spark.sql.extensions=org.apache.spark.sql.SparkSession \
      /opt/spark/jobs/load_s3_to_clickhouse.py

Environment variables (override defaults in config/etl_config.py):
    S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
    CH_HOST, CH_HTTP_PORT, CH_USER, CH_PASSWORD, CH_DATABASE
    SNAPSHOT_DATE — partition date to load (default: today)
    LOAD_TABLES — comma-separated list of pg_table keys to load (default: all)
"""

import os
import sys
from datetime import date

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lit

# Add config dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "config"))
from etl_config import (
    S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET,
    CH_HOST, CH_HTTP_PORT, CH_USER, CH_PASSWORD, CH_DATABASE,
    PG_TO_CH,
    s3_key,
)

# Tables that require special handling (denormalized, different source)
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
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
        .getOrCreate()
    )


def read_s3_parquet(spark, schema: str, table: str, snapshot_date: str):
    """Read Parquet from S3 for a given table and snapshot date."""
    key = s3_key(schema, table, snapshot_date)
    s3_path = f"s3a://{S3_BUCKET}/{key}"
    try:
        return spark.read.parquet(s3_path)
    except Exception as e:
        print(f"[WARN] No data at {s3_path}: {e}")
        return None


def read_denorm_parquet(spark, pg_table: str, snapshot_date: str):
    """Read denormalized parquet by alias."""
    schema = pg_table.split(".")[0]
    alias = pg_table.split(".")[1]
    key = s3_key(schema, alias, snapshot_date)
    s3_path = f"s3a://{S3_BUCKET}/{key}"
    try:
        return spark.read.parquet(s3_path)
    except Exception as e:
        print(f"[WARN] No denorm data at {s3_path}: {e}")
        return None


def write_to_clickhouse(df, ch_table: str):
    """Write DataFrame to ClickHouse via JDBC."""
    ch_url = f"jdbc:clickhouse://{CH_HOST}:{CH_HTTP_PORT}/{CH_DATABASE}"
    (
        df.write
        .format("jdbc")
        .option("url", ch_url)
        .option("dbtable", ch_table)
        .option("user", CH_USER)
        .option("password", CH_PASSWORD)
        .option("driver", "ru.yandex.clickhouse.ClickHouseDriver")
        .mode("append")
        .save()
    )


def write_to_clickhouse_native(df, ch_table: str):
    """
    Alternative: write via native ClickHouse JDBC bridge.
    For Spark 3.5+ with clickhouse-jdbc driver.
    """
    ch_url = f"jdbc:clickhouse://{CH_HOST}:9000/{CH_DATABASE}"
    (
        df.write
        .format("jdbc")
        .option("url", ch_url)
        .option("dbtable", ch_table)
        .option("user", CH_USER)
        .option("password", CH_PASSWORD)
        .option("driver", "com.clickhouse.jdbc.ClickHouseDriver")
        .mode("append")
        .save()
    )


def load_standard_tables(spark, snapshot_date: str, table_filter: list = None):
    """Load standard PG tables (1:1 mapping to ClickHouse)."""
    results = []
    for pg_table, ch_table in PG_TO_CH.items():
        if table_filter and pg_table not in table_filter:
            continue
        # Skip denorm tables — handled separately
        if pg_table in DENORM_TABLES:
            continue

        schema, table = pg_table.split(".")
        try:
            df = read_s3_parquet(spark, schema, table, snapshot_date)
            if df is None:
                print(f"[SKIP] {pg_table} — no parquet data")
                continue

            # Add snapshot_date column
            df = df.withColumn("snapshot_date", lit(snapshot_date).cast("date"))

            count = df.count()
            if count == 0:
                print(f"[SKIP] {pg_table} → {ch_table} — empty")
                continue

            print(f"[LOAD] {pg_table} → {ch_table} ({count} rows)")
            write_to_clickhouse(df, ch_table)
            print(f"[OK] {pg_table} → {ch_table}")
            results.append({"pg_table": pg_table, "ch_table": ch_table, "rows": count, "mode": "standard"})
        except Exception as e:
            print(f"[FAIL] {pg_table} → {ch_table}: {e}")
            import traceback
            traceback.print_exc()
            results.append({"pg_table": pg_table, "ch_table": ch_table, "error": str(e), "mode": "standard"})
    return results


def load_denorm_tables(spark, snapshot_date: str, table_filter: list = None):
    """Load denormalized tables (products_denorm → products, etc.)."""
    results = []
    for pg_table, ch_table in DENORM_TABLES.items():
        if table_filter and pg_table not in table_filter:
            continue

        try:
            df = read_denorm_parquet(spark, pg_table, snapshot_date)
            if df is None:
                print(f"[SKIP] {pg_table} — no parquet data")
                continue

            # Add snapshot_date column
            df = df.withColumn("snapshot_date", lit(snapshot_date).cast("date"))

            count = df.count()
            if count == 0:
                print(f"[SKIP] {pg_table} → {ch_table} — empty")
                continue

            print(f"[LOAD] {pg_table} → {ch_table} ({count} rows)")
            write_to_clickhouse(df, ch_table)
            print(f"[OK] {pg_table} → {ch_table}")
            results.append({"pg_table": pg_table, "ch_table": ch_table, "rows": count, "mode": "denorm"})
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
