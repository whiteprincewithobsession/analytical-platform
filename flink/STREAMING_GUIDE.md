# Streaming Pipeline — Kafka → Flink → ClickHouse

## Архитектура

```
Flink (PyFlink Datagen)
    |
    | 1 запись/3сек, TUMBLE(6sec) aggregation
    v
Kafka topic: flink-sink-clickhouse
    |
    | Kafka Engine (авточтение)
    v
ClickHouse Materialized View
    |
    v
analytics.orders_streaming (MergeTree)
```

## Быстрый запуск

### 1. Запустить streaming сервисы

```bash
docker compose -f docker-compose.streaming.yml up -d
```

### 2. Подключить ClickHouse к сети Kafka

ClickHouse и Kafka по умолчанию в разных Docker сетях:

```bash
docker network connect streaming-pipeline-network olap_retail
```

Проверка:

```bash
docker exec olap_retail ping -c 2 -W 3 kafka
```

### 3. Создать таблицы в ClickHouse

```bash
docker exec olap_retail clickhouse-client --multiquery --query "
CREATE TABLE IF NOT EXISTS analytics.orders_streaming (
    window_start DateTime,
    window_end DateTime,
    total_orders UInt64,
    total_revenue Float64,
    avg_amount Float64,
    unique_users UInt64,
    ingested_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (window_start, window_end);

CREATE TABLE IF NOT EXISTS analytics.kafka_orders_queue (
    window_start String,
    window_end String,
    total_orders UInt64,
    total_revenue Float64,
    avg_amount Float64,
    unique_users UInt64
) ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'kafka:9092',
    kafka_topic_list = 'flink-sink-clickhouse',
    kafka_group_name = 'clickhouse-ch-consumer',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 1,
    kafka_skip_broken_messages = 10000;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_kafka_to_streaming
TO analytics.orders_streaming
AS
SELECT
    toDateTime(substring(window_start, 1, 19)) AS window_start,
    toDateTime(substring(window_end, 1, 19)) AS window_end,
    total_orders,
    total_revenue,
    avg_amount,
    unique_users
FROM analytics.kafka_orders_queue;
"
```

### 4. Запустить Flink PyFlink job

```bash
docker cp flink/jobs/run-streaming-demo.py streaming-flink-jobmanager:/opt/flink/usrlib/run-streaming-demo.py
docker exec streaming-flink-jobmanager flink run -py /opt/flink/usrlib/run-streaming-demo.py
```

### 5. Проверить результат

```bash
docker exec olap_retail clickhouse-client --query "SELECT count() FROM analytics.orders_streaming"

docker exec olap_retail clickhouse-client --query "
SELECT window_start, window_end, total_orders,
       round(total_revenue, 2) as revenue,
       round(avg_amount, 2) as avg_check,
       unique_users
FROM analytics.orders_streaming
ORDER BY window_start DESC LIMIT 10 FORMAT Pretty"
```

## Управление Flink Jobs

### Запустить новую PyFlink job

Перед запуском нужно скопировать файл в контейнер:

```bash
docker cp flink/jobs/ТВОЙ_НОВЫЙ.py streaming-flink-jobmanager:/opt/flink/usrlib/ТВОЙ_НОВЫЙ.py
docker exec streaming-flink-jobmanager flink run -py /opt/flink/usrlib/ТВОЙ_НОВЫЙ.py
```

### Отменить текущую job

Через CLI:

```bash
docker exec streaming-flink-jobmanager flink list
docker exec streaming-flink-jobmanager flink cancel <JOB_ID>
```

Через Web UI: http://localhost:8084 → клик на job → Cancel Job

### Полный цикл: отменить + запустить новую

```bash
docker exec streaming-flink-jobmanager flink list
docker exec streaming-flink-jobmanager flink cancel <JOB_ID>
docker cp flink/jobs/my-new-job.py streaming-flink-jobmanager:/opt/flink/usrlib/my-new-job.py
docker exec streaming-flink-jobmanager flink run -py /opt/flink/usrlib/my-new-job.py
```

## Troubleshooting

### flink run не работает с .sql файлами

Ошибка: `Could not get job jar and dependencies from JAR file`

`flink run` принимает только JAR файлы. Для Python скриптов:

```bash
flink run -py /opt/flink/usrlib/myscript.py
```

### Kafka connector not found в SQL Client

Ошибка: `Could not find any factory for identifier 'kafka'`

SQL Client контейнер не запускает `init-connectors.sh`. Копировать JAR вручную + рестарт:

```bash
docker exec streaming-flink-sql-client cp /opt/flink/custom-lib/flink-sql-connector-kafka-*.jar /opt/flink/lib/
docker compose -f docker-compose.streaming.yml --profile tools down
docker compose -f docker-compose.streaming.yml --profile tools up -d
```

### numRecordsIn = 0 (Flink не читает из Kafka)

`earliest-offset` уже прочитал все данные при старте, consumer group запомнил позицию.

Сменить `group.id` или использовать `latest-offset`:

```python
'properties.group.id' = 'my-new-unique-group-id',
'scan.startup.mode' = 'latest-offset',
```

### Streaming job никогда не завершается

Это нормально. Streaming jobs работают бесконечно. Для проверки использовать `collect()` с таймаутом или писать в sink (Kafka/ClickHouse).

### JDBC sink не работает с ClickHouse

Ошибка: `Could not find any jdbc dialect factory that can handle url 'jdbc:clickhouse://'`

Flink JDBC connector не поддерживает ClickHouse dialect. Решение: писать в Kafka → ClickHouse читает через Kafka Engine.

### ClickHouse не подключается к Kafka

Ошибка: `Failed to resolve 'kafka:9092': Name or service not known`

ClickHouse и Kafka в разных Docker сетях:

```bash
docker network connect streaming-pipeline-network olap_retail
docker exec olap_retail ping -c 2 -W 3 kafka
```

После подключения пересоздать Kafka Engine table с новым `kafka_group_name`.

### ClickHouse не читает данные из Kafka

Таблица создана, но `orders_streaming` пустая.

Возможные причины:
- Старый consumer group уже прочитал данные → сменить `kafka_group_name`
- Битые сообщения → увеличить `kafka_skip_broken_messages`
- Неправильный формат дат → использовать `substring(window_start, 1, 19)` вместо `parseDateTimeBestEffort`

Полный сброс:

```bash
docker exec olap_retail clickhouse-client --multiquery --query "
DROP TABLE IF EXISTS analytics.mv_kafka_to_streaming SYNC;
DROP TABLE IF EXISTS analytics.kafka_orders_queue SYNC;
TRUNCATE TABLE analytics.orders_streaming;"
```

Пересоздать с новым group name и проверить `system.kafka_consumers`.

### TUMBLE окна не закрываются

WATERMARK не двигается — данные старые. Использовать `CURRENT_TIMESTAMP` как event_time (для datagen) или отправлять сообщения с актуальным `created_at`.

## Диагностика

### Статус Flink job

```bash
docker exec streaming-flink-jobmanager flink list
```

### Offsets Kafka topic

```bash
docker exec streaming-kafka kafka-run-class kafka.tools.GetOffsetShell \
    --broker-list kafka:9092 --topic flink-sink-clickhouse
```

### Прочитать сообщения из Kafka

```bash
docker exec streaming-kafka kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic flink-sink-clickhouse \
    --timeout-ms 10000 --max-messages 5
```

### Проверить Kafka consumer в ClickHouse

```bash
docker exec olap_retail clickhouse-client --query "
SELECT database, table, exceptions.text
FROM system.kafka_consumers FORMAT Vertical"
```

### Проверка Docker сетей

```bash
docker network ls | findstr streaming
docker network inspect streaming-pipeline-network | findstr olap_retail
```

### Мониторинг в реальном времени

```bash
for /L %i in (1,0,2) do @timeout /t 5 /nobreak >nul && docker exec olap_retail clickhouse-client --query "SELECT count() as records FROM analytics.orders_streaming"
```

### Web интерфейсы

- Flink: http://localhost:8084
- Kafka UI: http://localhost:8090

## Product Views Streaming Pipeline (новый)

### Архитектура

```
Python Generator (~5 events/sec)
    |
    | topic: product-views
    v
Kafka topic: product-views
    |
    | Flink Job: product_views_aggregation.py
    | TUMBLE(10sec) aggregation
    v
Kafka topic: product-views-aggregated
    |
    | Kafka Engine (clickhouse)
    v
ClickHouse Materialized View
    |
    v
analytics.product_views_streaming (MergeTree)
```

### Быстрый запуск

```bash
# 1. Streaming сервисы
docker compose -f docker-compose.streaming.yml up -d

# 2. ClickHouse к сети Kafka
docker network connect streaming-pipeline-network olap_retail

# 3. Таблицы в ClickHouse
docker exec olap_retail clickhouse-client --multiquery < clickhouse/clickhouse-init/product_views_streaming.sql

# 4. Запустить генератор событий (в отдельном терминале)
pip install kafka-python
python flink/product_views_generator.py

# 5. Запустить Flink job
docker cp flink/jobs/product_views_aggregation.py streaming-flink-jobmanager:/opt/flink/usrlib/product_views_aggregation.py
docker exec streaming-flink-jobmanager flink run -py /opt/flink/usrlib/product_views_aggregation.py

# 6. Проверить
docker exec olap_retail clickhouse-client --query "SELECT count() FROM analytics.product_views_streaming"
docker exec olap_retail clickhouse-client --query "
SELECT window_start, window_end, total_views, unique_users,
       round(avg_session_duration, 1) as avg_dur, round(mobile_pct, 1) as mobile_pct
FROM analytics.product_views_streaming
ORDER BY window_start DESC LIMIT 10 FORMAT Pretty"
```

### Агрегации (каждые 10 секунд)

| Метрика | Описание |
|---------|----------|
| `total_views` | Общее количество просмотров |
| `unique_users` | Уникальные пользователи |
| `avg_session_duration` | Средняя длительность сессии (сек) |
| `avg_scroll_depth` | Средняя глубина скролла (%) |
| `mobile_pct` | Процент мобильных устройств (%) |
| `electronics_views` | Просмотры электроники |
| `clothing_views` | Просмотры одежды |
| `home_views` | Просмотры товаров для дома |
| `toys_views` | Просмотры игрушек |

### Сброс pipeline

```bash
# Отменить Flink job
docker exec streaming-flink-jobmanager flink cancel <JOB_ID>

# Сбросить ClickHouse
docker exec olap_retail clickhouse-client --multiquery --query "
DROP TABLE IF EXISTS analytics.mv_kafka_to_product_views SYNC;
DROP TABLE IF EXISTS analytics.kafka_product_views_queue SYNC;
TRUNCATE TABLE analytics.product_views_streaming;"

# Пересоздать таблицы
docker exec olap_retail clickhouse-client --multiquery < clickhouse/clickhouse-init/product_views_streaming.sql

# Перезапустить генератор + Flink job
```

## Файлы проекта

| Файл | Назначение |
|------|------------|
| `jobs/run-streaming-demo.py` | PyFlink job: Datagen → TUMBLE(6sec) → Kafka |
| `jobs/product_views_aggregation.py` | PyFlink job: product-views → TUMBLE(10s) → aggregated |
| `product_views_generator.py` | Генератор ~5 событий/сек в Kafka topic: product-views |
| `Dockerfile` | Flink образ с PyFlink и коннекторами |
| `connectors/` | JAR коннекторы (Kafka, JDBC, JSON) |
| `generate_mock_events.py` | Генератор тестовых данных для Kafka |
| `../clickhouse/clickhouse-init/product_views_streaming.sql` | ClickHouse DDL для product views |

## Ключевые параметры

### Flink PyFlink job

```python
env.set_parallelism(1)

# Source — datagen
'rows-per-second' = '1'
'fields.user_id.min' = '1'
'fields.user_id.max' = '20'

# TUMBLE window
INTERVAL '6' SECONDS

# Watermark
WATERMARK FOR created_at AS created_at - INTERVAL '2' SECONDS
```

### ClickHouse Kafka Engine

```sql
kafka_broker_list = 'kafka:9092'
kafka_topic_list = 'flink-sink-clickhouse'
kafka_group_name = 'clickhouse-ch-v5'     -- уникальный consumer group
kafka_format = 'JSONEachRow'
kafka_num_consumers = 1
kafka_skip_broken_messages = 10000
```

## Чеклист запуска

- [ ] `docker compose -f docker-compose.streaming.yml up -d`
- [ ] `docker network connect streaming-pipeline-network olap_retail`
- [ ] `docker exec olap_retail ping -c 2 -W 3 kafka` → OK
- [ ] Созданы таблицы в ClickHouse (target + Kafka Engine + MV)
- [ ] Flink job запущена (`flink list` → RUNNING)
- [ ] Kafka topic растёт (offset увеличивается)
- [ ] ClickHouse consumer без ошибок (`system.kafka_consumers`)
- [ ] `SELECT count() FROM analytics.orders_streaming` → растёт

## Правила

1. Всегда меняй `kafka_group_name` при пересоздании Kafka Engine таблицы
2. Всегда проверяй Docker сети — ClickHouse и Kafka должны видеть друг друга
3. Используй `substring(date, 1, 19)` для парсинга дат из Flink JSON
4. Streaming job не завершается — это нормально
5. `flink run` не работает с .sql — только JAR или `-py`
6. Flink SQL Client не инициализирует коннекторы — нужно копировать JAR вручную
7. Watermark зависит от event_time — используй `CURRENT_TIMESTAMP` для datagen
