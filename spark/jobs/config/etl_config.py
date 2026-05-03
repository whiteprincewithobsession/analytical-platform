"""
Shared ETL configuration — table mappings, incremental columns,
PostgreSQL → ClickHouse type mapping, S3 paths.
"""

from pyspark.sql.types import (
    StringType, IntegerType, LongType, DoubleType,
    DecimalType, DateType, TimestampType, BooleanType,
    StructType, StructField
)

# ============================================================
# Connection defaults (override via env / Spark conf)
# ============================================================
PG_HOST = "retail_container"
PG_PORT = 5432
PG_DATABASE = "omni_retail_core"
PG_USER = "admin"
PG_PASSWORD = "admin"

S3_ENDPOINT = "http://localstack:4566"
S3_ACCESS_KEY = "test"
S3_SECRET_KEY = "test"
S3_BUCKET = "etl-staging"

CH_HOST = "clickhouse"
CH_HTTP_PORT = 8123
CH_USER = "default"
CH_PASSWORD = "admin"
CH_DATABASE = "analytics"

# ============================================================
# Table groups
# ============================================================

# Tables with updated_at for incremental load
INCREMENTAL_TABLES = {
    "cart.cart": "updated_at",
    "cart.cart_items": "updated_at",
    "catalog.products": "updated_at",
    "catalog.inventory": "updated_at",
    "sales.orders": "updated_at",
    "sales.order_items": "created_at",     # order_items не меняется
    "feedback.reviews": "updated_at",
    "promo.promotions": "updated_at",
    "system.user_activity": "activity_time",
}

# Full-load (справочники, маленькие, меняются редко)
FULL_LOAD_TABLES = {
    "core.users": None,
    "core.roles": None,
    "core.regions": None,
    "core.addresses": None,
    "catalog.categories": None,
    "catalog.brands": None,
    "catalog.warehouses": None,
    "catalog.suppliers": None,
    "sales.payment_methods": None,
    "sales.payment_statuses": None,
    "sales.delivery_types": None,
    "sales.currencies": None,
    "sales.currency_rates": None,
    "system.loyalty_levels": None,
    "system.loyalty_programs": None,
    "system.device_types": None,
    "promo.product_promotions": None,
    "sales.order_status_history": None,
}

# ============================================================
# Mapping: PostgreSQL schema.table → ClickHouse table
# ============================================================
PG_TO_CH = {
    "core.users":                    "users",
    "catalog.products":              "products",
    "sales.orders":                  "orders_flat",
    "sales.order_items":             "orders_flat",   # merge into orders_flat
    "cart.cart":                     "carts",
    "cart.cart_items":               "cart_items",
    "catalog.inventory":             "inventory",
    "feedback.reviews":              "reviews",
    "promo.promotions":              "promotions",
    "system.loyalty_levels":         "loyalty_levels",
    "sales.order_status_history":    "order_status_history",
    "system.user_activity":          "user_activity",
}

# ============================================================
# S3 path layout: s3://bucket/pg/{schema}/{table}/snapshot_date=YYYY-MM-DD/
# ============================================================
def s3_key(schema: str, table: str, snapshot_date: str) -> str:
    return f"pg/{schema}/{table}/snapshot_date={snapshot_date}/{table}.parquet"


# ============================================================
# Denormalization queries — для tables_flat + merge orders+items
# ============================================================

# orders_flat: JOIN orders + order_items + denormalized dimensions
ORDERS_FLAT_QUERY = """
SELECT
    o.id AS order_id,
    o.user_id,
    o.order_date,
    o.created_at,
    o.updated_at,
    o.status,
    o.total_amount,
    COALESCE(ps.name, '') AS payment_status,
    COALESCE(pm.name, '') AS payment_method,
    COALESCE(dt.name, '') AS delivery_type,
    COALESCE(a.country, '') AS country,
    COALESCE(a.city, '') AS city,
    o.currency_code,
    o.currency_rate_at_order,
    COALESCE(ll.level_name, '') AS loyalty_level_name,
    o.promo_code,
    o.discount_amount,
    COALESCE(o.source_channel, '') AS source_channel,
    COALESCE(dv.name, '') AS device_type,
    oi.id AS order_item_id,
    oi.product_id,
    COALESCE(p.name, '') AS product_name,
    COALESCE(cat.name, '') AS product_category,
    COALESCE(b.name, '') AS product_brand,
    oi.quantity,
    oi.price AS item_price,
    oi.discount_amount AS item_discount,
    (oi.quantity * (oi.price - COALESCE(oi.discount_amount, 0))) AS item_total
FROM sales.orders o
JOIN sales.order_items oi ON oi.order_id = o.id
LEFT JOIN catalog.products p ON p.id = oi.product_id
LEFT JOIN catalog.categories cat ON cat.id = p.category_id
LEFT JOIN catalog.brands b ON b.id = p.brand_id
LEFT JOIN sales.payment_statuses ps ON ps.code = o.payment_status_code
LEFT JOIN sales.payment_methods pm ON pm.code = o.payment_method_code
LEFT JOIN sales.delivery_types dt ON dt.code = o.delivery_type_code
LEFT JOIN core.addresses a ON a.id = o.address_id
LEFT JOIN system.loyalty_levels ll ON ll.id = o.loyalty_level_id
LEFT JOIN system.device_types dv ON dv.id = o.device_type_id
"""

# products denormalized: + brand + category path
PRODUCTS_DENORM_QUERY = """
SELECT
    p.id,
    p.code,
    p.name,
    p.description,
    COALESCE(b.name, '') AS brand_name,
    COALESCE(cat.name, '') AS category_path,
    p.category_id,
    p.price,
    p.cost,
    p.sku,
    p.active,
    p.created_at,
    p.updated_at
FROM catalog.products p
LEFT JOIN catalog.brands b ON b.id = p.brand_id
LEFT JOIN catalog.categories cat ON cat.id = p.category_id
"""

# users denormalized: + loyalty level + region
USERS_DENORM_QUERY = """
SELECT
    u.id,
    u.email,
    u.phone,
    u.registered_at,
    u.last_login,
    u.is_active,
    u.is_confirmed,
    u.first_name,
    u.last_name,
    u.birthday,
    u.gender,
    u.preferred_locale,
    u.timezone,
    COALESCE(ll.level_name, '') AS loyalty_level_name,
    COALESCE(r.name, '') AS region_name
FROM core.users u
LEFT JOIN system.loyalty_levels ll ON ll.id = u.loyalty_level_id
LEFT JOIN core.regions r ON r.id = ll.region_id  -- если region_id есть
"""

# inventory denormalized: + warehouse + product names
INVENTORY_DENORM_QUERY = """
SELECT
    i.id,
    i.warehouse_id,
    COALESCE(w.name, '') AS warehouse_name,
    COALESCE(w.city, '') AS warehouse_city,
    i.product_id,
    COALESCE(p.name, '') AS product_name,
    i.quantity_available,
    i.quantity_reserved,
    i.min_stock_level,
    i.reorder_point,
    i.last_restock_date,
    i.updated_at
FROM catalog.inventory i
LEFT JOIN catalog.warehouses w ON w.id = i.warehouse_id
LEFT JOIN catalog.products p ON p.id = i.product_id
"""

# reviews denormalized: + product name
REVIEWS_DENORM_QUERY = """
SELECT
    r.id,
    r.user_id,
    r.product_id,
    COALESCE(p.name, '') AS product_name,
    r.order_id,
    r.rating,
    r.title,
    r.content,
    r.verified_purchase,
    r.moderation_status,
    r.visible,
    r.created_at,
    r.updated_at
FROM feedback.reviews r
LEFT JOIN catalog.products p ON p.id = r.product_id
"""
