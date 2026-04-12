"""
PyFlink: Datagen → TUMBLE(6sec) → Kafka
"""
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment, EnvironmentSettings

def main():
    print("Starting PyFlink: Datagen → TUMBLE(6sec) → Kafka")

    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(1)

    t_env = StreamTableEnvironment.create(
        env,
        environment_settings=EnvironmentSettings.in_streaming_mode()
    )

    t_env.execute_sql("""
        CREATE TABLE orders_gen (
            order_id STRING,
            user_id INT,
            product_id STRING,
            amount DOUBLE,
            created_at AS CURRENT_TIMESTAMP,
            WATERMARK FOR created_at AS created_at - INTERVAL '2' SECONDS
        ) WITH (
            'connector' = 'datagen',
            'rows-per-second' = '1',
            'fields.order_id.length' = '6',
            'fields.user_id.kind' = 'random',
            'fields.user_id.min' = '1',
            'fields.user_id.max' = '20',
            'fields.amount.min' = '500',
            'fields.amount.max' = '5000'
        )
    """)
    print("Source: orders_gen (datagen)")

    t_env.execute_sql("""
        CREATE TABLE agg_sink (
            window_start STRING,
            window_end STRING,
            total_orders BIGINT,
            total_revenue DOUBLE,
            avg_amount DOUBLE,
            unique_users BIGINT
        ) WITH (
            'connector' = 'kafka',
            'topic' = 'flink-sink-clickhouse',
            'properties.bootstrap.servers' = 'kafka:9092',
            'format' = 'json'
        )
    """)
    print("Sink: Kafka flink-sink-clickhouse")

    print("Starting streaming aggregation...")
    t_env.execute_sql("""
        INSERT INTO agg_sink
        SELECT
            CAST(TUMBLE_START(created_at, INTERVAL '6' SECONDS) AS STRING),
            CAST(TUMBLE_END(created_at, INTERVAL '6' SECONDS) AS STRING),
            COUNT(*),
            CAST(SUM(amount) AS DOUBLE),
            ROUND(AVG(amount), 2),
            COUNT(DISTINCT user_id)
        FROM orders_gen
        GROUP BY TUMBLE(created_at, INTERVAL '6' SECONDS)
    """)

if __name__ == '__main__':
    main()
