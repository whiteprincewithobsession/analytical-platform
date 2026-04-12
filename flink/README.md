# Streaming Pipeline — Apache Kafka + Apache Flink

## Архитектура

```
PostgreSQL (CDC) → Kafka Topics → Flink Jobs → ClickHouse
                                      ↓
                              Real-time Analytics
```

## Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| Kafka | `9092` | Брокер сообщений (KRaft mode, без ZooKeeper) |
| Kafka UI | `8090` | Web-интерфейс для управления Kafka |
| Flink JobManager | `8084` | Web UI + координация jobs |
| Flink TaskManager | — | Execution engine (4 task slots) |
| Flink SQL Client | — | Интерактивный SQL (profile: tools) |

## Kafka Topics (auto-created)

| Topic | Partitions | Retention | Назначение |
|-------|------------|-----------|------------|
| `orders-events` | 3 | 7 days | События заказов |
| `sales-stream` | 3 | 7 days | Поток продаж (real-time) |
| `user-activity` | 3 | 3 days | Активность пользователей |
| `inventory-updates` | 2 | 3 days | Обновления остатков |
| `cdc-postgres` | 4 | 7 days | CDC из PostgreSQL (Debezium) |
| `flink-sink-clickhouse` | 3 | 7 days | Sink в ClickHouse |

## Команды

### Запуск

```bash
# Все сервисы
docker compose -f docker-compose.streaming.yml up -d

# С SQL Client (для разработки)
docker compose -f docker-compose.streaming.yml --profile tools up -d
```

### Остановка

```bash
docker compose -f docker-compose.streaming.yml down

# С удалением volumes
docker compose -f docker-compose.streaming.yml down -v
```

### Логи

```bash
docker logs -f streaming-kafka
docker logs -f streaming-flink-jobmanager
docker logs -f streaming-flink-taskmanager
```

### Kafka CLI

```bash
# Список топиков
docker exec streaming-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Описать топик
docker exec streaming-kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic orders-events

# Просмотр сообщений (consume)
docker exec streaming-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic orders-events --from-beginning

# Отправка сообщений (produce)
docker exec streaming-kafka kafka-console-producer --bootstrap-server localhost:9092 --topic orders-events

# Размер топика
docker exec streaming-kafka kafka-log-dirs --bootstrap-server localhost:9092 --describe
```

### Flink CLI

```bash
# Подключиться к JobManager
docker exec -it streaming-flink-jobmanager bash

# Submit job
docker exec streaming-flink-jobmanager flink run /opt/flink/usrlib/my-job.jar

# List jobs
docker exec streaming-flink-jobmanager flink list

# Cancel job
docker exec streaming-flink-jobmanager flink cancel <job-id>

# Savepoint
docker exec streaming-flink-jobmanager flink savepoint <job-id> /tmp/flink-savepoints
```

### Flink SQL Client

```bash
# Запуск с SQL Client
docker compose -f docker-compose.streaming.yml --profile tools up -d

# Подключение
docker exec -it streaming-flink-sql-client bash
/opt/flink/bin/sql-client.sh

# Пример SQL запроса в клиенте:
CREATE TABLE orders_events (
    order_id STRING,
    user_id STRING,
    amount DOUBLE,
    currency STRING,
    event_time TIMESTAMP(3),
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECONDS
) WITH (
    'connector' = 'kafka',
    'topic' = 'orders-events',
    'properties.bootstrap.servers' = 'kafka:9092',
    'properties.group.id' = 'flink-consumer',
    'format' = 'json',
    'scan.startup.mode' = 'latest-offset'
);

SELECT * FROM orders_events;
```

## Добавление Flink Jobs

1. Скомпилируйте job в JAR
2. Поместите в `flink/jobs/my-job.jar`
3. Submit через CLI или Flink Web UI (`http://localhost:8084`)

## Добавление коннекторов

Поместите JAR коннекторов в `flink/connectors/`:
- `flink-sql-connector-kafka.jar`
- `flink-sql-connector-clickhouse.jar`
- `flink-json.jar`

## Интеграция с Airflow

Можно создать DAG для мониторинга Kafka topics:

```python
from airflow import DAG
from airflow.providers.http.sensors.http import HttpSensor
from datetime import datetime

default_args = {'retries': 1}

with DAG('kafka_health_check', default_args=default_args, schedule='@hourly'):
    HttpSensor(
        task_id='check_kafka',
        http_conn_id='kafka_ui',
        endpoint='/api/v1/health',
        timeout=10,
    )
```

## URLs

| Сервис | URL |
|--------|-----|
| Kafka UI | http://localhost:8090 |
| Flink Dashboard | http://localhost:8084 |

## Ресурсы

- По умолчанию: 2 TaskManager × 4 slots = 8 parallel tasks
- Память: JobManager 1GB, TaskManager 1.7GB each
- Checkpointing: каждые 60s, EXACTLY_ONCE
- State backend: RocksDB
