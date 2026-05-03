from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import logging
import json
from io import BytesIO


CLICKHOUSE_CONFIG = {
    'host': 'olap_retail',
    'port': 8123,
    'username': 'admin',
    'password': 'admin',
    'database': 'analytics'
}

S3_BUCKET = 'clickhouse-exports'
S3_ENDPOINT = 'http://localstack:4566'

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

def get_clickhouse_client():
    import clickhouse_connect
    return clickhouse_connect.get_client(**CLICKHOUSE_CONFIG)

def test_connections(**context):
    import clickhouse_connect
    import boto3
    
    logging.info("=" * 60)
    logging.info("🔍 TESTING CONNECTIONS")
    logging.info("=" * 60)
    
    try:
        logging.info(f"Connecting to ClickHouse: {CLICKHOUSE_CONFIG['host']}:{CLICKHOUSE_CONFIG['port']}")
        client = clickhouse_connect.get_client(**CLICKHOUSE_CONFIG)
        
        version = client.query("SELECT version()").result_rows[0][0]
        logging.info(f"✅ ClickHouse connected! Version: {version}")
        
        databases = client.query("SHOW DATABASES").result_rows
        logging.info(f"   Databases: {[d[0] for d in databases]}")
        
        tables = client.query("""
            SELECT name, engine, total_rows 
            FROM system.tables 
            WHERE database = 'analytics'
        """).result_rows
        
        logging.info(f"   Tables in 'analytics': {len(tables)}")
        for t in tables:
            logging.info(f"     - {t[0]} ({t[1]}): {t[2]} rows")
        
        client.close()
        
    except Exception as e:
        logging.error(f" ClickHouse connection failed: {e}")
        raise
    
    try:
        logging.info(f"\nConnecting to S3: {S3_ENDPOINT}")
        s3 = get_s3_client()
        
        try:
            s3.head_bucket(Bucket=S3_BUCKET)
            logging.info(f" S3 Bucket '{S3_BUCKET}' exists")
        except:
            s3.create_bucket(Bucket=S3_BUCKET)
            logging.info(f" S3 Bucket '{S3_BUCKET}' created")
        
    except Exception as e:
        logging.error(f" S3 connection failed: {e}")
        raise
    
    logging.info("=" * 60)
    logging.info("✅ All connections OK!")
    logging.info("=" * 60)
    
    return True

def get_tables(**context):
    import clickhouse_connect
    
    logging.info("=" * 60)
    logging.info("📋 GETTING TABLES FROM CLICKHOUSE")
    logging.info("=" * 60)
    
    client = clickhouse_connect.get_client(**CLICKHOUSE_CONFIG)
    
    databases = client.query("SHOW DATABASES").result_rows
    logging.info(f"Available databases: {[d[0] for d in databases]}")
    
    query = """
        SELECT 
            database,
            name,
            engine,
            total_rows,
            formatReadableSize(total_bytes) as size
        FROM system.tables
        WHERE database = 'analytics'
          AND name NOT LIKE '.%'
          AND engine != ''
        ORDER BY total_rows DESC
    """
    
    logging.info(f"Executing query:\n{query}")
    
    result = client.query(query)
    
    tables = []
    for row in result.result_rows:
        table_info = {
            'database': row[0],
            'table': row[1],
            'engine': row[2],
            'rows': row[3] if row[3] else 0,
            'size': row[4] if row[4] else '0 B',
            'full_name': f"{row[0]}.{row[1]}"
        }
        tables.append(table_info)
        logging.info(f"  Found: {table_info['full_name']} ({table_info['engine']}) - {table_info['rows']} rows")
    
    client.close()
    
    if not tables:
        logging.warning("⚠️ No tables found in 'analytics' database!")
        logging.info("Checking if analytics database exists...")
        
        client = clickhouse_connect.get_client(
            host=CLICKHOUSE_CONFIG['host'],
            port=CLICKHOUSE_CONFIG['port'],
            username=CLICKHOUSE_CONFIG['username'],
            password=CLICKHOUSE_CONFIG['password']
        )
        
        all_tables = client.query("""
            SELECT database, name, engine, total_rows
            FROM system.tables
            WHERE engine != ''
            ORDER BY database, name
        """).result_rows
        
        logging.info(f"All tables in ClickHouse ({len(all_tables)}):")
        for t in all_tables[:20]:  # Первые 20
            logging.info(f"  {t[0]}.{t[1]} ({t[2]}) - {t[3]} rows")
        
        client.close()
    
    logging.info(f"\n Total tables to export: {len(tables)}")
    
    context['ti'].xcom_push(key='tables_list', value=tables)
    
    return len(tables)

def export_tables(**context):
    import clickhouse_connect
    import pandas as pd
    import numpy as np
    
    tables = context['ti'].xcom_pull(key='tables_list', task_ids='get_tables')
    
    logging.info(" EXPORTING TABLES TO S3")
    
    if not tables:
        logging.warning(" No tables to export!")
        context['ti'].xcom_push(key='export_results', value=[])
        return 0
    
    logging.info(f"Tables to export: {len(tables)}")
    
    client = clickhouse_connect.get_client(**CLICKHOUSE_CONFIG)
    s3 = get_s3_client()
    execution_date = context['ds']
    
    results = []
    
    def convert_complex_types(df):
        for col in df.columns:
            sample = df[col].dropna().iloc[0] if not df[col].dropna().empty else None
            
            if sample is not None:
                if isinstance(sample, (list, tuple, dict, np.ndarray)):
                    logging.info(f"      Converting column '{col}' from {type(sample).__name__} to JSON string")
                    df[col] = df[col].apply(lambda x: json.dumps(x, default=str) if x is not None else None)
                
                elif isinstance(sample, bytes):
                    logging.info(f"      Converting column '{col}' from bytes to string")
                    df[col] = df[col].apply(lambda x: x.decode('utf-8', errors='ignore') if x is not None else None)
        
        return df
    
    for table_info in tables:
        table_name = table_info['table']
        full_name = table_info['full_name']
        
        try:
            logging.info(f"\n Exporting: {full_name}")
            
            sql = f"SELECT * FROM {full_name} LIMIT 10000"
            logging.info(f"   SQL: {sql}")
            
            result = client.query(sql)
            columns = result.column_names
            data = result.result_rows
            
            df = pd.DataFrame(data, columns=columns)
            
            logging.info(f"   Fetched: {len(df)} rows, {len(df.columns)} columns")
            
            if df.empty:
                logging.warning(f"   ⚠️ Empty table, skipping")
                continue
            
            logging.info(f"   Converting complex types...")
            df = convert_complex_types(df)
            
            buffer = BytesIO()
            df.to_parquet(buffer, engine='pyarrow', compression='snappy', index=False)
            buffer.seek(0)
            
            file_size = len(buffer.getvalue())
            
            s3_key = f"clickhouse/{table_name}/dt={execution_date}/{table_name}.parquet.snappy"
            
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=buffer.getvalue()
            )
            
            logging.info(f"    Uploaded to s3://{S3_BUCKET}/{s3_key}")
            logging.info(f"   Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
            
            results.append({
                'table': full_name,
                'rows': len(df),
                'size_bytes': file_size,
                's3_key': s3_key,
                'status': 'success'
            })
            
        except Exception as e:
            logging.error(f"    Error: {e}")
            import traceback
            logging.error(traceback.format_exc())
            results.append({
                'table': full_name,
                'status': 'error',
                'error': str(e)
            })
    
    client.close()
    
    context['ti'].xcom_push(key='export_results', value=results)
    
    success_count = len([r for r in results if r.get('status') == 'success'])
    logging.info(f"\n Exported {success_count}/{len(tables)} tables")
    
    return success_count

def create_summary(**context):
    """Создает итоговый отчет"""
    results = context['ti'].xcom_pull(key='export_results', task_ids='export_tables')
    
    logging.info("=" * 60)
    logging.info(" EXPORT SUMMARY")
    logging.info("=" * 60)
    
    if not results:
        logging.warning("No export results!")
        return
    
    total_rows = 0
    total_size = 0
    
    for r in results:
        if r.get('status') == 'success':
            total_rows += r.get('rows', 0)
            total_size += r.get('size_bytes', 0)
            logging.info(f" {r['table']}: {r['rows']:,} rows ({r['size_bytes']:,} bytes)")
        else:
            logging.info(f" {r['table']}: {r.get('error', 'Unknown error')}")
    
    logging.info("-" * 60)
    logging.info(f"TOTAL: {total_rows:,} rows, {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
    
    # Сохраняем manifest в S3
    s3 = get_s3_client()
    
    manifest = {
        'export_date': context['ds'],
        'export_timestamp': datetime.now().isoformat(),
        'total_tables': len(results),
        'successful': len([r for r in results if r.get('status') == 'success']),
        'total_rows': total_rows,
        'total_size_bytes': total_size,
        'files': results
    }
    
    manifest_key = f"manifests/dt={context['ds']}/manifest.json"
    
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=manifest_key,
        Body=json.dumps(manifest, indent=2, default=str).encode('utf-8'),
        ContentType='application/json'
    )
    
    logging.info(f"\n📄 Manifest: s3://{S3_BUCKET}/{manifest_key}")
    logging.info("=" * 60)


with DAG(
    dag_id='clickhouse_to_s3',
    default_args=DEFAULT_ARGS,
    description='ClickHouse to S3 Export',
    schedule_interval=None,
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['clickhouse', 's3', 'export'],
) as dag:

    t1 = PythonOperator(
        task_id='test_connections',
        python_callable=test_connections,
        doc_md="""\
### Проверка подключений

Устанавливает соединение с ClickHouse и LocalStack S3.
Перечисляет базы данных и таблицы в схеме analytics, выводит количество строк.
Создает S3-бакет `clickhouse-exports`, если он ещё не существует.
""",
    )

    t2 = PythonOperator(
        task_id='get_tables',
        python_callable=get_tables,
        doc_md="""\
### Получение списка таблиц

Запрашивает метаданные из system.tables: имя, движок, количество строк, размер.
Исключает системные таблицы (начинающиеся с точки) и пустые таблицы.
Результат сохраняется в XCom для использования следующей задачей.
""",
    )

    t3 = PythonOperator(
        task_id='export_tables',
        python_callable=export_tables,
        doc_md="""\
### Экспорт таблиц в S3

Выгружает каждую таблицу из ClickHouse (лимит 10 000 строк) и сохраняет в формате Parquet (сжатие snappy) в S3.
Автоматически конвертирует сложные типы: Array, Tuple, Dict -- в JSON-строки.
Путь в S3: `clickhouse/{table}/dt={execution_date}/{table}.parquet.snappy`.
""",
    )

    t4 = PythonOperator(
        task_id='create_summary',
        python_callable=create_summary,
        doc_md="""\
### Создание итогового отчёта

Формирует manifest-файл с метаданными экспорта: количество таблиц, строк, общий размер, список файлов.
Сохраняет manifest в S3: `manifests/dt={execution_date}/manifest.json`.
Выводит сводку в лог Airflow.
""",
    )
    
    t1 >> t2 >> t3 >> t4