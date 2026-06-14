"""
Product Views Generator — генерирует события просмотров продуктов в Kafka.
Скорость: ~5 events/sec.
Топик: product-views
"""

import json
import time
import random
import uuid
from datetime import datetime, timezone
from kafka import KafkaProducer

KAFKA_BOOTSTRAP = "localhost:9094"
TOPIC = "product-views"
RATE_PER_SEC = 5

# Mock data
PRODUCTS = [
    ("SKU-001", "iPhone 15 Pro", "catalog_electronics", "smartphones"),
    ("SKU-002", "Samsung Galaxy S24", "catalog_electronics", "smartphones"),
    ("SKU-003", "Nike Air Max 90", "catalog_clothing", "shoes"),
    ("SKU-004", "Adidas Ultraboost", "catalog_clothing", "shoes"),
    ("SKU-005", "MacBook Pro 14", "catalog_electronics", "laptops"),
    ("SKU-006", "Sony WH-1000XM5", "catalog_electronics", "headphones"),
    ("SKU-007", "Dyson V15 Detect", "catalog_home", "vacuum_cleaners"),
    ("SKU-008", "LEGO Technic Porsche", "catalog_toys", "constructor"),
]

USERS = [f"user-{i}" for i in range(1, 51)]  # 50 пользователей

DEVICES = ["desktop", "mobile", "tablet"]
BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Yandex"]
TRAFFIC_SOURCES = ["organic", "paid_search", "social", "direct", "referral", "email"]


def generate_event():
    product_id, product_name, catalog, subcategory = random.choice(PRODUCTS)
    ts = datetime.now(timezone.utc)

    return {
        "event_id": str(uuid.uuid4()),
        "user_id": random.choice(USERS),
        "product_id": product_id,
        "product_name": product_name,
        "catalog": catalog,
        "subcategory": subcategory,
        "device": random.choice(DEVICES),
        "browser": random.choice(BROWSERS),
        "traffic_source": random.choice(TRAFFIC_SOURCES),
        "session_duration_sec": round(random.uniform(1.0, 120.0), 1),
        "scroll_depth_pct": random.randint(0, 100),
        "event_time": ts.strftime("%Y-%m-%dT%H:%M:%S.") + f"{ts.microsecond // 1000:03d}Z",
    }


def main():
    print(f"=== Product Views Generator ===")
    print(f"Kafka: {KAFKA_BOOTSTRAP}, Topic: {TOPIC}")
    print(f"Rate: ~{RATE_PER_SEC} events/sec")

    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP,
        value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),
        acks="all",
        retries=3,
        max_block_ms=5000,
    )

    print("Kafka producer connected. Sending events...")
    print("(Press Ctrl+C to stop)\n")

    total_sent = 0
    interval = 1.0 / RATE_PER_SEC

    try:
        while True:
            event = generate_event()
            producer.send(TOPIC, value=event)
            total_sent += 1

            if total_sent % 10 == 0:
                print(f"  Sent: {total_sent} events")

            time.sleep(interval)

    except KeyboardInterrupt:
        print(f"\n=== Stopped. Total events sent: {total_sent} ===")
    finally:
        producer.flush()
        producer.close()


if __name__ == "__main__":
    main()
