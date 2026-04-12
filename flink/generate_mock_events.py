import json
import random
import time
from datetime import datetime, timezone
from kafka import KafkaProducer

KAFKA_BOOTSTRAP_SERVERS = ['localhost:9094']

PRODUCTS = [
    'iphone-15-pro', 'macbook-pro-14', 'airpods-pro-2', 'ipad-air',
    'apple-watch-ultra', 'samsung-s24', 'sony-wh1000xm5', 'dell-xps-15'
]

STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
CURRENCIES = ['RUB', 'USD', 'EUR']
USER_ACTIONS = ['login', 'logout', 'view_product', 'add_to_cart', 'remove_from_cart', 'checkout', 'search', 'review']


def generate_order_event():
    return {
        'order_id': f'ORD-{random.randint(10000, 99999)}',
        'user_id': f'user-{random.randint(1, 100)}',
        'product_id': random.choice(PRODUCTS),
        'amount': round(random.uniform(1000, 300000), 2),
        'currency': random.choice(CURRENCIES),
        'status': random.choice(STATUSES),
        'created_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z',
    }


def generate_user_activity():
    return {
        'user_id': f'user-{random.randint(1, 100)}',
        'action': random.choice(USER_ACTIONS),
        'page': f'/page/{random.randint(1, 20)}',
        'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z',
        'device': random.choice(['desktop', 'mobile', 'tablet']),
    }


def generate_inventory_update():
    return {
        'product_id': random.choice(PRODUCTS),
        'warehouse_id': f'WH-{random.randint(1, 5)}',
        'quantity_change': random.randint(-50, 100),
        'new_stock': random.randint(0, 500),
        'updated_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z',
    }


def main():
    print(f"Connecting to Kafka: {KAFKA_BOOTSTRAP_SERVERS}")

    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        acks='all',
        retries=3,
    )

    print("Producer connected. Sending events every 2 seconds...")
    print("Press Ctrl+C to stop.\n")

    count = 0
    try:
        while True:
            event = generate_order_event()
            producer.send('orders-events', value=event)

            activity = generate_user_activity()
            producer.send('user-activity', value=activity)

            if random.random() < 0.3:
                inventory = generate_inventory_update()
                producer.send('inventory-updates', value=inventory)

            producer.flush()
            count += 1

            if count % 10 == 0:
                print(f"Sent {count} events...")

            time.sleep(2)

    except KeyboardInterrupt:
        print(f"\nStopped. Total events sent: {count}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        producer.close()


if __name__ == '__main__':
    main()
