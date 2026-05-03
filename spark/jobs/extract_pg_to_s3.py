"""
Spark ETL — Extract: PostgreSQL → LocalStack S3 (Parquet)

Usage (via spark-submit):
    spark-submit \
      --master spark://spark-master:7077 \
      --packages org.postgresql:postgresql:42.7.1,org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1 \
      --conf spark.sql.extensions=org.apache.spark.sql.SparkSession \
      /opt/spark/jobs/extract_pg_to_s3.py

Environment variables (override defaults in config/etl_config.py):
    PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD
    S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
    INCREMENTAL_WATERMARK — ISO date for incremental load (e.g. 2025-01-01)
    SNAPSHOT_DATE — partition date in S3 (default: today)
"""

import os
import sys
from datetime import datetime, date

from pyspark.sql import SparkSession
from pyspark.sql.functions import lit, col

# Add config dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "config"))
from etl_config import (
    PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD,
    S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET,
    INCREMENTAL_TABLES, FULL_LOAD_TABLES,
    PRODUCTS_DENORM_QUERY, USERS_DENORM_QUERY,
    INVENTORY_DENORM_QUERY, REVIEWS_DENORM_QUERY,
    ORDERS_FLAT_QUERY,
    s3_key,
)


def build_spark_session() -> SparkSession:
    return (
        SparkSession.builder
        .appName("pg-to-s3-extract")
        .master(os.environ.get("SPARK_MASTER", "spark://spark-master:7077"))
        .config("spark.jars.packages", "org.postgresql:postgresql:42.7.1")
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


def pg_url(database: str = PG_DATABASE) -> str:
    return f"jdbc:postgresql://{PG_HOST}:{PG_PORT}/{database}"


def read_pg_table(spark, schema: str, table: str, watermark: str = None, timestamp_col: str = None):
    """Read a single PG table with optional incremental filter."""
    query = f'"{schema}"."{table}"'
    df = (
        spark.read
        .format("jdbc")
        .option("url", pg_url())
        .option("dbtable", query)
        .option("user", PG_USER)
        .option("password", PG_PASSWORD)
        .option("driver", "org.postgresql.Driver")
        .option("fetchsize", "10000")
        .option("numPartitions", "4")
        .load()
    )
    if watermark and timestamp_col:
        df = df.filter(col(timestamp_col) >= watermark)
    return df


def write_s3_parquet(df, schema: str, table: str, snapshot_date: str):
    """Write DataFrame to S3 as Parquet (snappy compression)."""
    key = s3_key(schema, table, snapshot_date)
    s3_path = f"s3a://{S3_BUCKET}/{key}"
    (
        df.write
        .mode("overwrite")
        .option("compression", "snappy")
        .parquet(s3_path)
    )
    return s3_path


def extract_full_load_tables(spark, snapshot_date: str):
    """Extract all full-load (reference) tables."""
    results = []
    for pg_table, _ in FULL_LOAD_TABLES.items():
        schema, table = pg_table.split(".")
        try:
            df = read_pg_table(spark, schema, table)
            count = df.count()
            if count == 0:
                print(f"[SKIP] {pg_table} — empty")
                continue
            s3_path = write_s3_parquet(df, schema, table, snapshot_date)
            print(f"[OK] {pg_table} → {s3_path} ({count} rows)")
            results.append({"table": pg_table, "rows": count, "s3_path": s3_path, "mode": "full"})
        except Exception as e:
            print(f"[FAIL] {pg_table}: {e}")
            results.append({"table": pg_table, "error": str(e), "mode": "full"})
    return results


def extract_incremental_tables(spark, snapshot_date: str, watermark: str):
    """Extract tables with incremental load (WHERE timestamp_col >= watermark)."""
    results = []
    for pg_table, ts_col in INCREMENTAL_TABLES.items():
        schema, table = pg_table.split(".")
        try:
            df = read_pg_table(spark, schema, table, watermark=watermark, timestamp_col=ts_col)
            count = df.count()
            if count == 0:
                print(f"[SKIP] {pg_table} — no new rows since {watermark}")
                continue
            s3_path = write_s3_parquet(df, schema, table, snapshot_date)
            print(f"[OK] {pg_table} (incremental) → {s3_path} ({count} rows, watermark={watermark})")
            results.append({"table": pg_table, "rows": count, "s3_path": s3_path,
                            "mode": "incremental", "watermark": watermark, "ts_col": ts_col})
        except Exception as e:
            print(f"[FAIL] {pg_table}: {e}")
            results.append({"table": pg_table, "error": str(e), "mode": "incremental"})
    return results


def extract_denormalized(spark, snapshot_date: str):
    """Extract denormalized views (products, users, orders_flat, etc.)."""
    results = []

    denorm_queries = {
        ("catalog", "products_denorm"): PRODUCTS_DENORM_QUERY,
        ("core", "users_denorm"): USERS_DENORM_QUERY,
        ("catalog", "inventory_denorm"): INVENTORY_DENORM_QUERY,
        ("feedback", "reviews_denorm"): REVIEWS_DENORM_QUERY,
    }

    for (schema, alias), query in denorm_queries.items():
        try:
            df = spark.read \
                .format("jdbc") \
                .option("url", pg_url()) \
                .option("query", query.strip()) \
                .option("user", PG_USER) \
                .option("password", PG_PASSWORD) \
                .option("driver", "org.postgresql.Driver") \
                .option("fetchsize", "10000") \
                .option("numPartitions", "4") \
                .load()
            count = df.count()
            if count == 0:
                print(f"[SKIP] {alias} — empty")
                continue
            s3_path = write_s3_parquet(df, schema, alias, snapshot_date)
            print(f"[OK] {alias} → {s3_path} ({count} rows)")
            results.append({"table": alias, "rows": count, "s3_path": s3_path, "mode": "denorm"})
        except Exception as e:
            print(f"[FAIL] {alias}: {e}")
            results.append({"table": alias, "error": str(e), "mode": "denorm"})

    # orders_flat: JOIN orders + order_items
    try:
        df_orders = spark.read \
            .format("jdbc") \
            .option("url", pg_url()) \
            .option("query", ORDERS_FLAT_QUERY.strip()) \
            .option("user", PG_USER) \
            .option("password", PG_PASSWORD) \
            .option("driver", "org.postgresql.Driver") \
            .option("fetchsize", "10000") \
            .option("numPartitions", "4") \
            .load()
        count = df_orders.count()
        if count > 0:
            s3_path = write_s3_parquet(df_orders, "sales", "orders_flat", snapshot_date)
            print(f"[OK] orders_flat → {s3_path} ({count} rows)")
            results.append({"table": "orders_flat", "rows": count, "s3_path": s3_path, "mode": "denorm"})
    except Exception as e:
        print(f"[FAIL] orders_flat: {e}")
        results.append({"table": "orders_flat", "error": str(e), "mode": "denorm"})

    return results


def main():
    spark = build_spark_session()
    spark.sparkContext.setLogLevel("INFO")

    snapshot_date = os.environ.get("SNAPSHOT_DATE", date.today().isoformat())
    watermark = os.environ.get("INCREMENTAL_WATERMARK")

    print(f"=" * 60)
    print(f"EXTRACT: PostgreSQL → S3 (LocalStack)")
    print(f"Snapshot date: {snapshot_date}")
    print(f"Watermark: {watermark or 'full load only'}")
    print(f"S3 bucket: {S3_BUCKET}")
    print(f"=" * 60)

    all_results = []

    # 1. Full-load reference tables
    print("\n--- FULL LOAD TABLES ---")
    all_results.extend(extract_full_load_tables(spark, snapshot_date))

    # 2. Incremental tables
    if watermark:
        print("\n--- INCREMENTAL TABLES ---")
        all_results.extend(extract_incremental_tables(spark, snapshot_date, watermark))

    # 3. Denormalized queries
    print("\n--- DENORMALIZED QUERIES ---")
    all_results.extend(extract_denormalized(spark, snapshot_date))

    # Summary
    success = [r for r in all_results if "error" not in r]
    failed = [r for r in all_results if "error" in r]
    total_rows = sum(r.get("rows", 0) for r in success)

    print(f"\n{'=' * 60}")
    print(f"EXTRACT SUMMARY")
    print(f"  Total tables: {len(all_results)}")
    print(f"  Success: {len(success)}")
    print(f"  Failed: {len(failed)}")
    print(f"  Total rows: {total_rows:,}")
    if failed:
        for f in failed:
            print(f"  FAIL: {f['table']} — {f['error']}")
    print(f"{'=' * 60}")

    spark.stop()

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
