def test_clickhouse():
    import clickhouse_connect
    
    print(" Testing ClickHouse connection...")
    
    try:
        client = clickhouse_connect.get_client(
            host='clickhouse',
            port=8123,
            username='admin',
            password='admin',
            database='analytics'
        )
        
        result = client.query("SELECT version()")
        version = result.result_rows[0][0]
        print(f" ClickHouse connected! Version: {version}")
        
        result = client.query("""
            SELECT name, engine, total_rows 
            FROM system.tables 
            WHERE database = 'analytics'
            ORDER BY name
        """)
        
        print(f"\n Tables in 'analytics' database:")
        for row in result.result_rows:
            print(f"   - {row[0]:40s} | {row[1]:15s} | {row[2]:>10,} rows")
        
        client.close()
        return True
        
    except Exception as e:
        print(f" ClickHouse connection failed: {e}")
        return False

def test_s3():
    import boto3
    
    print("\n" + "=" * 60)
    print("🔍 Testing LocalStack S3 connection...")
    print("=" * 60)
    
    try:
        s3 = boto3.client(
            's3',
            endpoint_url='http://localstack:4566',
            aws_access_key_id='test',
            aws_secret_access_key='test',
            region_name='us-east-1'
        )
        
        response = s3.list_buckets()
        buckets = [b['Name'] for b in response.get('Buckets', [])]
        
        print(f" LocalStack S3 connected")
        print(f"   Buckets: {buckets if buckets else '(none)'}")
        
        test_bucket = 'test-connection'
        try:
            s3.create_bucket(Bucket=test_bucket)
            print(f"    Created test bucket: {test_bucket}")
            
            s3.put_object(
                Bucket=test_bucket,
                Key='test.txt',
                Body=b'Hello from Airflow!'
            )
            print(f"    Uploaded test file")
            
            obj = s3.get_object(Bucket=test_bucket, Key='test.txt')
            content = obj['Body'].read()
            print(f"    Read test file: {content.decode()}")
            
        except s3.exceptions.BucketAlreadyOwnedByYou:
            print(f"     Bucket {test_bucket} already exists")
        
        return True
        
    except Exception as e:
        print(f" LocalStack S3 connection failed: {e}")
        return False

if __name__ == '__main__':
    ch_ok = test_clickhouse()
    s3_ok = test_s3()
    
    print("\n" + "=" * 60)
    if ch_ok and s3_ok:
        print(" All tests passed!")
    else:
        print(" Some tests failed")
    print("=" * 60)