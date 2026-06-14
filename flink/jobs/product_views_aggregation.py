"""
Product Views Aggregation — Flink Streaming Job
Source: встроенный datagen (5 events/sec, имитирует product views)
Sink: Kafka topic product-views-aggregated
ClickHouse читает из Kafka через Kafka Engine + MV

Агрегации каждые 10 секунд:
  - total_views: общее количество просмотров
  - unique_users: уникальные пользователи
  - avg_session_duration: средняя длительность сессии (сек)
  - avg_scroll_depth: средняя глубина скролла (%)
"""

from pyflink.table import EnvironmentSettings, TableEnvironment


def main():
    print("=== Product Views Aggregation Job ===")

    env_settings = EnvironmentSettings.new_instance().in_streaming_mode().build()
    t_env = TableEnvironment.create(env_settings)

    # 1. SOURCE — встроенный datagen, 5 events/sec
    t_env.execute_sql("""
        CREATE TABLE product_views_gen (
            user_id STRING,
            product_id STRING,
            session_duration_sec DOUBLE,
            scroll_depth_pct INT,
            event_time AS CURRENT_TIMESTAMP,
            WATERMARK FOR event_time AS event_time - INTERVAL '5' SECONDS
        ) WITH (
            'connector' = 'datagen',
            'rows-per-second' = '5',
            'fields.user_id.kind' = 'random',
            'fields.user_id.length' = '8',
            'fields.product_id.kind' = 'random',
            'fields.product_id.length' = '6',
            'fields.session_duration_sec.min' = '1.0',
            'fields.session_duration_sec.max' = '120.0',
            'fields.scroll_depth_pct.min' = '0',
            'fields.scroll_depth_pct.max' = '100'
        )
    """)
    print("Source table created (datagen, 5 rows/sec)")

    # 2. SINK — Kafka
    t_env.execute_sql("""
        CREATE TABLE product_views_agg_sink (
            window_start STRING,
            window_end STRING,
            total_views BIGINT,
            unique_users BIGINT,
            avg_session_duration DOUBLE,
            avg_scroll_depth DOUBLE
        ) WITH (
            'connector' = 'kafka',
            'topic' = 'product-views-aggregated',
            'properties.bootstrap.servers' = 'kafka:9092',
            'format' = 'json',
            'sink.parallelism' = '1'
        )
    """)
    print("Sink table created (Kafka: product-views-aggregated)")

    # 3. INSERT — tumbling window 10 секунд
    print("Starting streaming aggregation (TUMBLE 10s)...")
    t_env.execute_sql("""
        INSERT INTO product_views_agg_sink
        SELECT
            CAST(TUMBLE_START(event_time, INTERVAL '10' SECONDS) AS STRING),
            CAST(TUMBLE_END(event_time, INTERVAL '10' SECONDS) AS STRING),
            COUNT(*) AS total_views,
            COUNT(DISTINCT user_id) AS unique_users,
            ROUND(AVG(session_duration_sec), 2) AS avg_session_duration,
            ROUND(AVG(scroll_depth_pct), 2) AS avg_scroll_depth
        FROM product_views_gen
        GROUP BY TUMBLE(event_time, INTERVAL '10' SECONDS)
    """)
    print("Job submitted!")


if __name__ == "__main__":
    main()
