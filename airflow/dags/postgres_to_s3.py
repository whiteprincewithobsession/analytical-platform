from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import logging
import json
from io import BytesIO

POSTGRES_CONFIG = {
    'host': 'retail_container',
    'port': 5432,
    'database': 'omni_retail_core',
    'user': 'admin',
    'password': 'admin'
}

S3_BUCKET = 'postgres-exports'
S3_ENDPOINT = 'http://localstack:4566'

SCHEMAS_TO_EXPORT = ['cart', 'catalog', 'core', 'system', 'feedback', 'promo', 'sales']
TABLES_TO_EXCLUDE = ['alembic_version', 'flyway_schema_history']

DEFAULT_ARGS = {
    'owner': 'data-team',
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

def get_s3_client():
    import boto3
    return boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id='test',
        aws_secret_access_key='test',
        region_name='us-east-1'
    )

def get_postgres_connection():
    import psycopg2
    return psycopg2.connect(**POSTGRES_CONFIG)

def test_connections(**context):
    import psycopg2
    
    logging.info("=" * 60)
    logging.info("TESTING CONNECTIONS")
    logging.info("=" * 60)
    
    try:
        logging.info(f"Connecting to PostgreSQL: {POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}")
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        logging.info(f"PostgreSQL connected: {version[:50]}...")
        
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT LIKE 'pg_%' 
              AND schema_name != 'information_schema'
            ORDER BY schema_name
        """)
        schemas = [row[0] for row in cursor.fetchall()]
        logging.info(f"Schemas: {schemas}")
        
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
        """)
        table_count = cursor.fetchone()[0]
        logging.info(f"Tables in public: {table_count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logging.error(f"PostgreSQL connection failed: {e}")
        raise
    
    try:
        logging.info(f"Connecting to S3: {S3_ENDPOINT}")
        s3 = get_s3_client()
        
        try:
            s3.head_bucket(Bucket=S3_BUCKET)
            logging.info(f"S3 Bucket {S3_BUCKET} exists")
        except:
            s3.create_bucket(Bucket=S3_BUCKET)
            logging.info(f"S3 Bucket {S3_BUCKET} created")
        
    except Exception as e:
        logging.error(f"S3 connection failed: {e}")
        raise
    
    logging.info("=" * 60)
    logging.info("All connections OK")
    logging.info("=" * 60)
    
    return True

def get_tables(**context):
    import psycopg2
    
    logging.info("=" * 60)
    logging.info("GETTING TABLES FROM POSTGRESQL")
    logging.info("=" * 60)
    
    conn = psycopg2.connect(**POSTGRES_CONFIG)
    cursor = conn.cursor()
    
    if SCHEMAS_TO_EXPORT:
        schema_filter = f"table_schema IN ({','.join(repr(s) for s in SCHEMAS_TO_EXPORT)})"
    else:
        schema_filter = "table_schema NOT LIKE 'pg_%' AND table_schema != 'information_schema'"
    
    query = f"""
        SELECT 
            t.table_schema,
            t.table_name,
            pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as size,
            pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) as size_bytes,
            (SELECT COUNT(*) FROM information_schema.columns c 
             WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as columns_count
        FROM information_schema.tables t
        WHERE {schema_filter}
          AND t.table_type = 'BASE TABLE'
        ORDER BY size_bytes DESC
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    tables = []
    for row in rows:
        schema, table, size, size_bytes, columns = row
        
        if table in TABLES_TO_EXCLUDE:
            continue
        
        try:
            cursor.execute(f"""
                SELECT reltuples::bigint 
                FROM pg_class 
                WHERE relname = '{table}' 
                  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '{schema}')
            """)
            row_count = cursor.fetchone()
            rows_approx = row_count[0] if row_count else 0
        except:
            rows_approx = 0
        
        table_info = {
            'schema': schema,
            'table': table,
            'full_name': f"{schema}.{table}",
            'size': size,
            'size_bytes': size_bytes,
            'columns': columns,
            'rows_approx': rows_approx
        }
        tables.append(table_info)
        logging.info(f"Found: {table_info['full_name']:40s} | {columns:3d} cols | ~{rows_approx:>10,} rows | {size}")
    
    cursor.close()
    conn.close()
    
    logging.info(f"Total tables to export: {len(tables)}")
    context['ti'].xcom_push(key='tables_list', value=tables)
    
    return len(tables)

def export_tables(**context):
    import psycopg2
    import pandas as pd
    import numpy as np
    
    tables = context['ti'].xcom_pull(key='tables_list', task_ids='get_tables')
    
    logging.info("=" * 60)
    logging.info("EXPORTING TABLES TO S3")
    logging.info("=" * 60)
    
    if not tables:
        logging.warning("No tables to export")
        context['ti'].xcom_push(key='export_results', value=[])
        return 0
    
    logging.info(f"Tables to export: {len(tables)}")
    
    conn = psycopg2.connect(**POSTGRES_CONFIG)
    s3 = get_s3_client()
    execution_date = context['ds']
    
    results = []
    
    def convert_complex_types(df):
        for col in df.columns:
            try:
                non_null = df[col].dropna()
                if non_null.empty:
                    continue
                
                sample = non_null.iloc[0]
                
                if isinstance(sample, (list, tuple, dict, np.ndarray)):
                    logging.info(f"Converting {col} ({type(sample).__name__}) to JSON")
                    df[col] = df[col].apply(
                        lambda x: json.dumps(x, default=str, ensure_ascii=False) 
                        if x is not None and not (isinstance(x, float) and pd.isna(x))
                        else None
                    )
                
                elif hasattr(sample, 'hex'):
                    logging.info(f"Converting {col} (UUID) to string")
                    df[col] = df[col].astype(str)
                
                elif type(sample).__name__ == 'Decimal':
                    logging.info(f"Converting {col} (Decimal) to float")
                    df[col] = df[col].astype(float)
                
                elif isinstance(sample, (bytes, memoryview)):
                    logging.info(f"Converting {col} (bytes) to string")
                    df[col] = df[col].apply(
                        lambda x: x.hex() if isinstance(x, (bytes, memoryview)) else x
                    )
                
                elif isinstance(sample, pd.Timedelta) or type(sample).__name__ == 'timedelta':
                    logging.info(f"Converting {col} (timedelta) to string")
                    df[col] = df[col].astype(str)
                    
            except Exception as e:
                logging.warning(f"Warning converting {col}: {e}")
                df[col] = df[col].astype(str)
        
        return df
    
    for table_info in tables:
        table_name = table_info['table']
        schema_name = table_info['schema']
        full_name = table_info['full_name']
        
        try:
            logging.info(f"Exporting: {full_name}")
            
            sql = f'SELECT * FROM "{schema_name}"."{table_name}" LIMIT 50000'
            logging.info(f"SQL: {sql}")
            
            df = pd.read_sql(sql, conn)
            
            logging.info(f"Fetched: {len(df)} rows, {len(df.columns)} columns")
            
            if df.empty:
                logging.warning(f"Empty table, skipping")
                continue
            
            logging.info(f"Processing complex types...")
            df = convert_complex_types(df)
            
            buffer = BytesIO()
            df.to_parquet(buffer, engine='pyarrow', compression='snappy', index=False)
            buffer.seek(0)
            
            file_size = len(buffer.getvalue())
            
            s3_key = f"postgres/{schema_name}/{table_name}/dt={execution_date}/{table_name}.parquet.snappy"
            
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=buffer.getvalue()
            )
            
            logging.info(f"Uploaded to s3://{S3_BUCKET}/{s3_key}")
            logging.info(f"Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
            
            results.append({
                'table': full_name,
                'rows': len(df),
                'size_bytes': file_size,
                's3_key': s3_key,
                'status': 'success'
            })
            
        except Exception as e:
            logging.error(f"Error: {e}")
            import traceback
            logging.error(traceback.format_exc())
            results.append({
                'table': full_name,
                'status': 'error',
                'error': str(e)
            })
    
    conn.close()
    
    context['ti'].xcom_push(key='export_results', value=results)
    
    success_count = len([r for r in results if r.get('status') == 'success'])
    logging.info(f"Exported {success_count}/{len(tables)} tables")
    
    return success_count

def create_summary(**context):
    results = context['ti'].xcom_pull(key='export_results', task_ids='export_tables')
    
    logging.info("=" * 60)
    logging.info("EXPORT SUMMARY")
    logging.info("=" * 60)
    
    if not results:
        logging.warning("No export results")
        return
    
    total_rows = 0
    total_size = 0
    
    for r in results:
        if r.get('status') == 'success':
            total_rows += r.get('rows', 0)
            total_size += r.get('size_bytes', 0)
            logging.info(f"SUCCESS {r['table']}: {r['rows']:,} rows ({r['size_bytes']:,} bytes)")
        else:
            logging.info(f"FAILED {r['table']}: {r.get('error', 'Unknown error')}")
    
    logging.info("-" * 60)
    logging.info(f"TOTAL: {total_rows:,} rows, {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
    
    s3 = get_s3_client()
    
    manifest = {
        'source': 'postgresql',
        'database': POSTGRES_CONFIG['database'],
        'export_date': context['ds'],
        'export_timestamp': datetime.now().isoformat(),
        'total_tables': len(results),
        'successful': len([r for r in results if r.get('status') == 'success']),
        'failed': len([r for r in results if r.get('status') == 'error']),
        'total_rows': total_rows,
        'total_size_bytes': total_size,
        'files': results
    }
    
    manifest_key = f"manifests/postgres/dt={context['ds']}/manifest.json"
    
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=manifest_key,
        Body=json.dumps(manifest, indent=2, default=str).encode('utf-8'),
        ContentType='application/json'
    )
    
    logging.info(f"Manifest: s3://{S3_BUCKET}/{manifest_key}")
    logging.info("=" * 60)

with DAG(
    dag_id='postgres_to_s3',
    default_args=DEFAULT_ARGS,
    description='PostgreSQL to S3 Export',
    schedule_interval=None,
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['postgres', 's3', 'export'],
) as dag:
    
    t1 = PythonOperator(
        task_id='test_connections',
        python_callable=test_connections
    )
    
    t2 = PythonOperator(
        task_id='get_tables',
        python_callable=get_tables
    )
    
    t3 = PythonOperator(
        task_id='export_tables',
        python_callable=export_tables
    )
    
    t4 = PythonOperator(
        task_id='create_summary',
        python_callable=create_summary
    )
    
    t1 >> t2 >> t3 >> t4