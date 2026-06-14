"""
Products API — CRUD для catalog.products + категории
"""

import os
import json
import logging
from datetime import datetime
from decimal import Decimal

import psycopg2
import psycopg2.extras
from flask import Flask, request, jsonify
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS", "*").split(","))

# ── DB Connection ──────────────────────────────────────────────
PG_HOST = os.getenv("PG_HOST", "retail_container")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_USER = os.getenv("PG_USER", "admin")
PG_PASSWORD = os.getenv("PG_PASSWORD", "admin")
PG_DATABASE = os.getenv("PG_DATABASE", "omni_retail_core")

APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "5556"))


def get_db():
    return psycopg2.connect(
        host=PG_HOST, port=PG_PORT, user=PG_USER,
        password=PG_PASSWORD, dbname=PG_DATABASE,
    )


# ── Icon mapping for categories ────────────────────────────────
CATEGORY_ICONS = {
    "electronics": "📡",
    "smartphones": "📱",
    "laptops": "💻",
    "tablets": "📟",
    "audio": "🎧",
    "wearables": "⌚",
    "accessories": "🔌",
    "home-appliances": "🏠",
    "kitchen": "🍳",
    "cleaning": "🧹",
    "gaming": "🎮",
    "consoles": "🕹️",
    "peripherals": "🖱️",
}

# Icon fallback by category name keywords
NAME_ICON_MAP = {
    "смартфон": "📱", "iphone": "📱", "samsung": "📱", "xiaomi": "📱", "pixel": "📱", "oneplus": "📱",
    "macbook": "💻", "ноутбук": "💻", "asus": "💻", "dell": "💻", "lenovo": "💻", "thinkpad": "💻",
    "ipad": "📟", "планшет": "📟", "tab": "📟",
    "airpods": "🎧", "наушник": "🎧", "sony wh": "🎧", "bose": "🎧", "колонк": "🔊", "jbl": "🔊",
    "watch": "⌚", "часы": "⌚", "garmin": "⌚", "браслет": "⌚",
    "зарядк": "🔋", "хаб": "🔌", "чехол": "🛡️", "powerbank": "🔋", "anker": "🔋",
    "пылесос": "🧹", "roborock": "🤖", "dyson": "🧹", "dreame": "🤖",
    "чайник": "☕", "блендер": "🍹", "аэрогриль": "🍳",
    "playstation": "🎮", "xbox": "🎮", "nintendo": "🎮", "steam deck": "🎮", "геймпад": "🕹️",
    "клавиатур": "⌨️", "мышь": "🖱️", "razer": "🖱️", "logitech": "🖱️",
}


def get_icon_for_product(name: str, category_code: str = "") -> str:
    name_lower = name.lower()
    for keyword, icon in NAME_ICON_MAP.items():
        if keyword in name_lower:
            return icon
    return CATEGORY_ICONS.get(category_code, "📦")


def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    return obj


def row_to_dict(row, cursor):
    if row is None:
        return None
    desc = cursor.description
    return {col.name: decimal_to_float(val) for col, val in zip(desc, row)}


def rows_to_list(rows, cursor):
    return [row_to_dict(r, cursor) for r in rows]


# ── Health ─────────────────────────────────────────────────────
@app.route("/health")
def health():
    try:
        conn = get_db()
        conn.close()
        return jsonify({"status": "ok", "service": "products-api", "db": "connected"})
    except Exception as e:
        return jsonify({"status": "error", "service": "products-api", "db": str(e)}), 500


# ── GET /categories ───────────────────────────────────────────
@app.route("/categories", methods=["GET"])
def get_categories():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, code, name, description, parent_id, slug, active, sort_order "
            "FROM catalog.categories ORDER BY sort_order, id"
        )
        cats = rows_to_list(cur.fetchall(), cur)
        for c in cats:
            c["icon"] = CATEGORY_ICONS.get(c.get("code", ""), "📁")
        cur.close()
        conn.close()
        return jsonify(cats)
    except Exception as e:
        logger.error(f"get_categories failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── GET /products ──────────────────────────────────────────────
@app.route("/products", methods=["GET"])
def get_products():
    try:
        conn = get_db()
        cur = conn.cursor()

        search = request.args.get("search", "").strip()
        category_id = request.args.get("category_id", "").strip()
        status = request.args.get("status", "").strip()  # active/inactive/all
        limit = min(int(request.args.get("limit", "200")), 500)
        offset = max(int(request.args.get("offset", "0")), 0)

        # If category_id is a parent, include all children recursively
        cat_ids = []
        if category_id:
            cat_ids.append(int(category_id))
            # Recursive CTE to find all descendants
            cur.execute(
                "WITH RECURSIVE cat_tree AS ("
                "  SELECT id FROM catalog.categories WHERE id = %s"
                "  UNION ALL"
                "  SELECT c.id FROM catalog.categories c"
                "  JOIN cat_tree ct ON c.parent_id = ct.id"
                ") SELECT id FROM cat_tree",
                (int(category_id),),
            )
            cat_ids = [r[0] for r in cur.fetchall()]

        query = """
            SELECT p.id, p.code, p.name, p.description, p.brand_id,
                   p.category_id, c.name AS category_name, c.code AS category_code,
                   p.price, p.cost, p.sku, p.active,
                   p.created_at, p.updated_at
            FROM catalog.products p
            JOIN catalog.categories c ON c.id = p.category_id
            WHERE 1=1
        """
        params = []

        if search:
            query += " AND (p.name ILIKE %s OR p.description ILIKE %s OR p.code ILIKE %s)"
            like = f"%{search}%"
            params.extend([like, like, like])

        if cat_ids:
            query += f" AND p.category_id = ANY(%s)"
            params.append(cat_ids)

        if status == "active":
            query += " AND p.active = true"
        elif status == "inactive":
            query += " AND p.active = false"

        query += " ORDER BY p.id DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        products = rows_to_list(cur.fetchall(), cur)
        for p in products:
            p["icon"] = get_icon_for_product(p.get("name", ""), p.get("category_code", ""))
            p["status"] = "active" if p.get("active") else "archived"
            # Get stock from inventory
            cur.execute(
                "SELECT COALESCE(SUM(quantity_available), 0) as total_stock "
                "FROM catalog.inventory WHERE product_id = %s",
                (p["id"],),
            )
            stock_row = cur.fetchone()
            p["stock"] = int(stock_row[0]) if stock_row else 0

        # Total count
        count_query = "SELECT COUNT(*) FROM catalog.products p WHERE 1=1"
        count_params = []
        if search:
            count_query += " AND (p.name ILIKE %s OR p.description ILIKE %s OR p.code ILIKE %s)"
            count_params.extend([like, like, like])
        if cat_ids:
            count_query += f" AND p.category_id = ANY(%s)"
            count_params.append(cat_ids)
        if status == "active":
            count_query += " AND p.active = true"
        elif status == "inactive":
            count_query += " AND p.active = false"

        cur.execute(count_query, count_params)
        total = cur.fetchone()[0]

        cur.close()
        conn.close()
        return jsonify({"products": products, "total": total, "limit": limit, "offset": offset})
    except Exception as e:
        logger.error(f"get_products failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── GET /products/<id> ─────────────────────────────────────────
@app.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT p.id, p.code, p.name, p.description, p.brand_id, "
            "p.category_id, c.name AS category_name, c.code AS category_code, "
            "p.price, p.cost, p.sku, p.active, p.created_at, p.updated_at "
            "FROM catalog.products p "
            "JOIN catalog.categories c ON c.id = p.category_id "
            "WHERE p.id = %s",
            (product_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Product not found"}), 404

        product = row_to_dict(row, cur)
        product["icon"] = get_icon_for_product(product.get("name", ""), product.get("category_code", ""))
        product["status"] = "active" if product.get("active") else "archived"

        cur.execute(
            "SELECT COALESCE(SUM(quantity_available), 0) as total_stock "
            "FROM catalog.inventory WHERE product_id = %s",
            (product_id,),
        )
        stock_row = cur.fetchone()
        product["stock"] = int(stock_row[0]) if stock_row else 0

        cur.close()
        conn.close()
        return jsonify(product)
    except Exception as e:
        logger.error(f"get_product failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── POST /products ─────────────────────────────────────────────
@app.route("/products", methods=["POST"])
def create_product():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    category_id = data.get("category_id")
    price = data.get("price")
    cost = data.get("cost")
    sku = data.get("sku", "").strip()
    active = data.get("active", True)

    if not name:
        return jsonify({"error": "name is required"}), 400
    if category_id is None:
        return jsonify({"error": "category_id is required"}), 400
    if price is None:
        return jsonify({"error": "price is required"}), 400
    try:
        price = float(price)
        if price <= 0:
            return jsonify({"error": "price must be positive"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "invalid price"}), 400

    if cost is not None:
        try:
            cost = float(cost)
        except (ValueError, TypeError):
            cost = None

    if not sku:
        sku = f"SKU-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    code = data.get("code", "").strip() or f"prod-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO catalog.products (code, name, description, category_id, price, cost, sku, active)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id, code, name, description, category_id, price, cost, sku, active, created_at, updated_at""",
            (code, name, description, int(category_id), price, cost, sku, active),
        )
        row = cur.fetchone()
        returning_desc = cur.description  # Save before next query
        conn.commit()

        # Get category info
        cur.execute("SELECT name, code FROM catalog.categories WHERE id = %s", (int(category_id),))
        cat_row = cur.fetchone()
        cat_name = cat_row[0] if cat_row else ""
        cat_code = cat_row[1] if cat_row else ""

        product = {col.name: decimal_to_float(val) for col, val in zip(returning_desc, row)}
        product["category_name"] = cat_name
        product["category_code"] = cat_code
        product["icon"] = get_icon_for_product(str(product.get("name", "")), cat_code)
        product["status"] = "active" if product.get("active") else "archived"
        product["stock"] = 0

        cur.close()
        conn.close()
        logger.info(f"Product created: {name} (id={product['id']})")
        return jsonify(product), 201
    except psycopg2.IntegrityError as e:
        conn.rollback()
        conn.close()
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            return jsonify({"error": "Product with this code or SKU already exists"}), 409
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"create_product failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── PUT /products/<id> ─────────────────────────────────────────
@app.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        # Check exists
        cur.execute("SELECT id FROM catalog.products WHERE id = %s", (product_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Product not found"}), 404

        fields = []
        params = []

        for key in ["name", "description", "code", "sku", "price", "cost", "category_id", "active"]:
            if key in data:
                val = data[key]
                if key == "price" and val is not None:
                    val = float(val)
                    if val <= 0:
                        cur.close()
                        conn.close()
                        return jsonify({"error": "price must be positive"}), 400
                if key == "cost" and val is not None:
                    val = float(val)
                if key == "category_id":
                    val = int(val)
                if key == "active":
                    val = bool(val)
                fields.append(f"{key} = %s")
                params.append(val)

        if not fields:
            cur.close()
            conn.close()
            return jsonify({"error": "No fields to update"}), 400

        fields.append("updated_at = now()")
        params.append(product_id)

        cur.execute(
            f"UPDATE catalog.products SET {', '.join(fields)} WHERE id = %s "
            "RETURNING id, code, name, description, category_id, price, cost, sku, active, created_at, updated_at",
            params,
        )
        row = cur.fetchone()
        returning_desc = cur.description
        conn.commit()

        final_cat_id = data.get("category_id") or (int(row[4]) if row else 0)
        cur.execute("SELECT name, code FROM catalog.categories WHERE id = %s", (final_cat_id,))
        cat_row = cur.fetchone()
        cat_name = cat_row[0] if cat_row else ""
        cat_code = cat_row[1] if cat_row else ""

        product = {col.name: decimal_to_float(val) for col, val in zip(returning_desc, row)}
        product["category_name"] = cat_name
        product["category_code"] = cat_code
        product["icon"] = get_icon_for_product(str(product.get("name", "")), cat_code)
        product["status"] = "active" if product.get("active") else "archived"
        product["stock"] = 0

        cur.close()
        conn.close()
        logger.info(f"Product updated: id={product_id}")
        return jsonify(product)
    except psycopg2.IntegrityError as e:
        conn.rollback()
        conn.close()
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            return jsonify({"error": "Product with this code or SKU already exists"}), 409
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"update_product failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── DELETE /products/<id> ──────────────────────────────────────
@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT name FROM catalog.products WHERE id = %s", (product_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Product not found"}), 404

        name = row[0]
        cur.execute("DELETE FROM catalog.products WHERE id = %s", (product_id,))
        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"Product deleted: {name} (id={product_id})")
        return jsonify({"success": True, "message": f"Product '{name}' deleted"})
    except psycopg2.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": "Cannot delete: product is referenced by other records (e.g., orders)"}), 409
    except Exception as e:
        logger.error(f"delete_product failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── POST /products/<id>/stock ──────────────────────────────────
@app.route("/products/<int:product_id>/stock", methods=["POST"])
def update_stock(product_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    quantity = data.get("quantity")
    warehouse_id = data.get("warehouse_id", 1)  # default warehouse

    if quantity is None:
        return jsonify({"error": "quantity is required"}), 400

    try:
        quantity = float(quantity)
        warehouse_id = int(warehouse_id)
    except (ValueError, TypeError):
        return jsonify({"error": "invalid quantity or warehouse_id"}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        # Check product exists
        cur.execute("SELECT id FROM catalog.products WHERE id = %s", (product_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Product not found"}), 404

        # Upsert inventory
        cur.execute(
            """INSERT INTO catalog.inventory (warehouse_id, product_id, quantity_available, updated_at)
               VALUES (%s, %s, %s, now())
               ON CONFLICT (warehouse_id, product_id)
               DO UPDATE SET quantity_available = EXCLUDED.quantity_available, updated_at = now()""",
            (warehouse_id, product_id, quantity),
        )
        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"Stock updated: product={product_id} warehouse={warehouse_id} qty={quantity}")
        return jsonify({"success": True, "warehouse_id": warehouse_id, "quantity": quantity})
    except Exception as e:
        logger.error(f"update_stock failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════
# SALES API — orders + order_items + user names + stats
# ══════════════════════════════════════════════════════════════

ORDER_STATUS_LABELS = {
    "pending": "Ожидает",
    "confirmed": "Подтверждён",
    "processing": "В обработке",
    "shipped": "Отправлен",
    "delivered": "Доставлен",
    "cancelled": "Отменён",
    "refunded": "Возврат",
}

PAYMENT_LABELS = {
    "card": "Карта", "sbp": "СБП", "apple_pay": "Apple Pay",
    "tinkoff_pay": "Tinkoff Pay", "qiwi": "QIWI", "yoomoney": "ЮMoney",
    "sberbank_online": "Сбербанк Онлайн", "cash": "Наличные",
}

DELIVERY_LABELS = {
    "courier_standard": "Курьер стандарт", "courier_express": "Курьер экспресс",
    "courier_next_day": "На следующий день", "pickup_point": "Пункт выдачи",
    "post_standard": "Почта", "post_registered": "Заказная почта",
}


def get_user_name(cur, user_id):
    cur.execute(
        "SELECT first_name || ' ' || last_name as full_name "
        "FROM core.users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if row and row[0].strip():
        return row[0].strip()
    cur.execute("SELECT email FROM core.users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    return row[0] if row else f"User #{user_id}"


def get_product_name(cur, product_id):
    cur.execute("SELECT name FROM catalog.products WHERE id = %s", (product_id,))
    row = cur.fetchone()
    return row[0] if row else f"Product #{product_id}"


# ── GET /sales ─────────────────────────────────────────────────
@app.route("/sales", methods=["GET"])
def get_sales():
    try:
        conn = get_db()
        cur = conn.cursor()

        search = request.args.get("search", "").strip()
        status = request.args.get("status", "").strip()
        min_price = request.args.get("min_price", "").strip()
        max_price = request.args.get("max_price", "").strip()
        date_from = request.args.get("date_from", "").strip()
        date_to = request.args.get("date_to", "").strip()
        payment = request.args.get("payment", "").strip()
        limit = min(int(request.args.get("limit", "200")), 500)
        offset = max(int(request.args.get("offset", "0")), 0)

        query = """
            SELECT o.id, o.user_id, o.order_date, o.status, o.total_amount,
                   o.payment_method_code, o.delivery_type_code, o.promo_code,
                   o.discount_amount, o.source_channel, o.comments, o.tracking_number,
                   o.address_id, o.created_at, o.updated_at
            FROM sales.orders o
            WHERE 1=1
        """
        params = []

        if search:
            like = f"%{search}%"
            query += """ AND (
                o.tracking_number ILIKE %s
                OR o.promo_code ILIKE %s
                OR o.comments ILIKE %s
                OR o.source_channel ILIKE %s
            )"""
            params.extend([like, like, like, like])

        if status:
            query += " AND o.status = %s"
            params.append(status)

        if min_price:
            query += " AND o.total_amount >= %s"
            params.append(float(min_price))

        if max_price:
            query += " AND o.total_amount <= %s"
            params.append(float(max_price))

        if date_from:
            query += " AND o.order_date >= %s"
            params.append(date_from)

        if date_to:
            query += " AND o.order_date <= %s"
            params.append(date_to)

        if payment:
            query += " AND o.payment_method_code = %s"
            params.append(payment)

        query += " ORDER BY o.id DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()
        desc = cur.description

        orders = []
        for row in rows:
            o = {col.name: decimal_to_float(val) for col, val in zip(desc, row)}
            o["user_name"] = get_user_name(cur, o["user_id"])
            o["status_label"] = ORDER_STATUS_LABELS.get(o["status"], o["status"])
            o["payment_label"] = PAYMENT_LABELS.get(o["payment_method_code"] or "", o["payment_method_code"] or "—")
            o["delivery_label"] = DELIVERY_LABELS.get(o["delivery_type_code"] or "", o["delivery_type_code"] or "—")

            # Get order items
            cur.execute(
                "SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name "
                "FROM sales.order_items oi "
                "LEFT JOIN catalog.products p ON p.id = oi.product_id "
                "WHERE oi.order_id = %s",
                (o["id"],),
            )
            items = []
            for ir in cur.fetchall():
                items.append({
                    "product_id": ir[0],
                    "quantity": ir[1],
                    "price": decimal_to_float(ir[2]),
                    "product_name": ir[3] or f"Product #{ir[0]}",
                })
            o["items"] = items

            # Get address
            if o.get("address_id"):
                cur.execute(
                    "SELECT street, house, building, apartment, postal_code, comment, "
                    "(SELECT region_name FROM core.regions WHERE id = a.region_id) as region_name "
                    "FROM core.addresses a WHERE id = %s",
                    (o["address_id"],),
                )
                addr_row = cur.fetchone()
                if addr_row:
                    parts = [addr_row[0], addr_row[1]]
                    if addr_row[2]: parts.append(addr_row[2])
                    if addr_row[3]: parts.append("кв. " + addr_row[3])
                    o["address"] = {
                        "full": ", ".join(parts),
                        "postal": addr_row[4],
                        "region": addr_row[6],
                        "comment": addr_row[5],
                    }
                else:
                    o["address"] = None
            else:
                o["address"] = None

            # Get status history
            cur.execute(
                "SELECT old_status, new_status, change_source, change_time "
                "FROM sales.order_status_history WHERE order_id = %s ORDER BY change_time",
                (o["id"],),
            )
            o["status_history"] = [
                {"from": r[0], "to": r[1], "source": r[2], "time": str(r[3])}
                for r in cur.fetchall()
            ]

            orders.append(o)

        # Stats
        cur.execute(
            "SELECT COUNT(*) as total, "
            "COALESCE(SUM(total_amount), 0) as revenue, "
            "COALESCE(AVG(total_amount), 0) as avg_order "
            "FROM sales.orders WHERE 1=1"
        )
        stats_row = cur.fetchone()
        stats = {
            "total_orders": stats_row[0],
            "total_revenue": decimal_to_float(stats_row[1]),
            "avg_order": decimal_to_float(stats_row[2]),
        }

        # Status breakdown
        cur.execute(
            "SELECT status, COUNT(*) FROM sales.orders GROUP BY status ORDER BY status"
        )
        stats["by_status"] = {r[0]: r[1] for r in cur.fetchall()}

        # Payment breakdown
        cur.execute(
            "SELECT payment_method_code, COUNT(*) FROM sales.orders "
            "WHERE payment_method_code IS NOT NULL "
            "GROUP BY payment_method_code ORDER BY COUNT(*) DESC LIMIT 10"
        )
        stats["by_payment"] = {r[0]: r[1] for r in cur.fetchall()}

        # Unique payments for filter
        cur.execute(
            "SELECT DISTINCT payment_method_code FROM sales.orders "
            "WHERE payment_method_code IS NOT NULL ORDER BY payment_method_code"
        )
        stats["payments"] = [r[0] for r in cur.fetchall()]

        cur.close()
        conn.close()
        return jsonify({"orders": orders, "stats": stats, "limit": limit, "offset": offset})
    except Exception as e:
        logger.error(f"get_sales failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════
# SUPPORT TICKETS API — обращения в поддержку
# ══════════════════════════════════════════════════════════════

EMAIL_API_URL = os.getenv("EMAIL_API_URL", "http://email-api:5555")


# ── POST /support-tickets — создать обращение ─────────────────
@app.route("/support-tickets", methods=["POST"])
def create_ticket():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    user_email = data.get("user_email", "").strip()
    user_name = data.get("user_name", "").strip()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()
    priority = data.get("priority", "normal")
    user_id = data.get("user_id")
    category = data.get("category", "general")

    if not user_email or "@" not in user_email:
        return jsonify({"error": "valid user_email is required"}), 400
    if not subject:
        return jsonify({"error": "subject is required"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400
    if priority not in ("low", "normal", "high", "critical"):
        return jsonify({"error": "invalid priority"}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        # If user_id provided, check it exists; if not, set to NULL
        actual_user_id = None
        if user_id:
            try:
                cur.execute("SELECT id FROM core.users WHERE id = %s", (int(user_id),))
                if cur.fetchone():
                    actual_user_id = int(user_id)
            except Exception:
                pass

        cur.execute(
            """INSERT INTO core.support_tickets (user_id, user_email, user_name, subject, message, priority, category)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               RETURNING id, user_id, user_email, user_name, subject, message, priority, status,
                         category, created_at, updated_at""",
            (actual_user_id, user_email, user_name or None, subject, message, priority, category),
        )
        row = cur.fetchone()
        desc = cur.description
        conn.commit()

        ticket = {col.name: str(val) if isinstance(val, datetime) else val for col, val in zip(desc, row)}

        # Also create the first message in ticket_messages
        cur.execute(
            """INSERT INTO core.ticket_messages (ticket_id, sender_type, sender_id, sender_name, message)
               VALUES (%s, 'user', %s, %s, %s)""",
            (ticket["id"], actual_user_id, user_name or user_email, message),
        )
        conn.commit()

        cur.close()
        conn.close()
        logger.info(f"Support ticket created: id={ticket['id']} from {user_email}")
        return jsonify(ticket), 201
    except Exception as e:
        logger.error(f"create_ticket failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── GET /support-tickets — список обращений ────────────────────
@app.route("/support-tickets", methods=["GET"])
def get_tickets():
    try:
        conn = get_db()
        cur = conn.cursor()

        user_id = request.args.get("user_id", "").strip()
        user_email = request.args.get("user_email", "").strip()
        status = request.args.get("status", "").strip()
        priority = request.args.get("priority", "").strip()
        search = request.args.get("search", "").strip()
        limit = min(int(request.args.get("limit", "100")), 500)
        offset = max(int(request.args.get("offset", "0")), 0)

        query = """
            SELECT t.id, t.user_id, t.user_email, t.user_name, t.subject, t.message,
                   t.priority, t.status, t.category, t.admin_reply,
                   t.created_at, t.updated_at, t.resolved_at,
                   u.first_name || ' ' || u.last_name as resolver_name
            FROM core.support_tickets t
            LEFT JOIN core.users u ON u.id = t.resolved_by
            WHERE 1=1
        """
        params = []

        if user_id:
            query += " AND t.user_id = %s"
            params.append(int(user_id))

        if user_email:
            query += " AND t.user_email = %s"
            params.append(user_email)

        if status:
            query += " AND t.status = %s"
            params.append(status)

        if priority:
            query += " AND t.priority = %s"
            params.append(priority)

        if search:
            like = f"%{search}%"
            query += " AND (t.subject ILIKE %s OR t.message ILIKE %s OR t.user_email ILIKE %s)"
            params.extend([like, like, like])

        query += " ORDER BY t.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()
        desc = cur.description

        tickets = []
        for row in rows:
            t = {}
            for col, val in zip(desc, row):
                v = val
                if isinstance(v, datetime):
                    v = v.isoformat()
                t[col.name] = v
            tickets.append(t)

        # Stats
        cur.execute("SELECT COUNT(*) FROM core.support_tickets")
        total = cur.fetchone()[0]

        cur.execute(
            "SELECT status, COUNT(*) FROM core.support_tickets GROUP BY status"
        )
        by_status = {r[0]: r[1] for r in cur.fetchall()}

        cur.close()
        conn.close()
        return jsonify({"tickets": tickets, "total": total, "stats": {"by_status": by_status}})
    except Exception as e:
        logger.error(f"get_tickets failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── GET /support-tickets/<id> — один тикет с сообщениями ──────
@app.route("/support-tickets/<int:ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute(
            """SELECT t.id, t.user_id, t.user_email, t.user_name, t.subject, t.message,
                      t.priority, t.status, t.category, t.admin_reply,
                      t.created_at, t.updated_at, t.resolved_at,
                      u.first_name || ' ' || u.last_name as resolver_name
               FROM core.support_tickets t
               LEFT JOIN core.users u ON u.id = t.resolved_by
               WHERE t.id = %s""",
            (ticket_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Ticket not found"}), 404

        desc = cur.description
        ticket = {}
        for col, val in zip(desc, row):
            v = val
            if isinstance(v, datetime):
                v = v.isoformat()
            ticket[col.name] = v

        # Get messages
        cur.execute(
            """SELECT id, sender_type, sender_name, message, is_internal, created_at
               FROM core.ticket_messages WHERE ticket_id = %s ORDER BY created_at ASC""",
            (ticket_id,),
        )
        messages = []
        for m in cur.fetchall():
            messages.append({
                "id": m[0],
                "sender_type": m[1],
                "sender_name": m[2],
                "message": m[3],
                "is_internal": m[4],
                "created_at": str(m[5]),
            })
        ticket["messages"] = messages

        cur.close()
        conn.close()
        return jsonify(ticket)
    except Exception as e:
        logger.error(f"get_ticket failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── PUT /support-tickets/<id>/reply — ответ админа ────────────
@app.route("/support-tickets/<int:ticket_id>/reply", methods=["POST"])
def reply_to_ticket(ticket_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    admin_reply = data.get("message", "").strip()
    new_status = data.get("status", "").strip()
    admin_id = data.get("admin_id")
    admin_name = data.get("admin_name", "Admin")
    send_email = data.get("send_email", True)
    is_internal = data.get("is_internal", False)

    if not admin_reply:
        return jsonify({"error": "message is required"}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        # Check ticket exists
        cur.execute(
            "SELECT id, user_email, user_name, subject, status FROM core.support_tickets WHERE id = %s",
            (ticket_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Ticket not found"}), 404

        t_id, t_email, t_name, t_subject, t_status = row

        # If ticket was resolved/closed, reopen it
        if t_status in ("resolved", "closed"):
            new_status = new_status or "in_progress"

        # Update ticket
        updates = ["updated_at = now()", "admin_reply = %s"]
        params = [admin_reply]

        if new_status and new_status != t_status:
            updates.append("status = %s")
            params.append(new_status)
            if new_status == "resolved":
                updates.append("resolved_at = now()")
                updates.append("resolved_by = %s")
                params.append(admin_id)

        params.append(ticket_id)
        cur.execute(
            f"UPDATE core.support_tickets SET {', '.join(updates)} WHERE id = %s",
            params,
        )
        conn.commit()

        # Save message — check admin_id exists
        actual_admin_id = None
        if admin_id:
            try:
                cur2 = conn.cursor()
                cur2.execute("SELECT id FROM core.users WHERE id = %s", (int(admin_id),))
                if cur2.fetchone():
                    actual_admin_id = int(admin_id)
                cur2.close()
            except Exception:
                pass

        cur.execute(
            """INSERT INTO core.ticket_messages (ticket_id, sender_type, sender_id, sender_name, message, is_internal)
               VALUES (%s, 'admin', %s, %s, %s, %s)""",
            (ticket_id, actual_admin_id, admin_name, admin_reply, is_internal),
        )
        conn.commit()

        cur.close()
        conn.close()
        logger.info(f"Admin replied to ticket {ticket_id}, status={new_status or t_status}")

        # Send email notification
        if send_email and not is_internal:
            try:
                import urllib.request as ureq
                email_subject = f"Re: {t_subject}"
                payload = json.dumps({
                    "to_email": t_email,
                    "user_name": t_name or t_email,
                    "subject": email_subject,
                    "admin_name": admin_name,
                    "reply_message": admin_reply,
                    "ticket_id": ticket_id,
                    "new_status": new_status or t_status,
                }).encode()
                req = ureq.Request(
                    f"{EMAIL_API_URL}/send-ticket-reply",
                    data=payload,
                    headers={"Content-Type": "application/json"},
                )
                resp = ureq.urlopen(req, timeout=15)
                resp_data = json.loads(resp.read().decode())
                logger.info(f"Ticket reply email queued: {resp_data}")
            except Exception as mail_err:
                logger.warning(f"Failed to send ticket reply email: {mail_err}")

        # Get updated ticket
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, status, admin_reply, updated_at FROM core.support_tickets WHERE id = %s",
            (ticket_id,),
        )
        r = cur.fetchone()
        result = {"id": r[0], "status": r[1], "admin_reply": r[2], "updated_at": str(r[3])}
        cur.close()
        conn.close()

        return jsonify(result)
    except Exception as e:
        logger.error(f"reply_to_ticket failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── PUT /support-tickets/<id>/status — изменить статус ────────
@app.route("/support-tickets/<int:ticket_id>/status", methods=["PUT"])
def update_ticket_status(ticket_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    new_status = data.get("status", "").strip()
    if new_status not in ("open", "in_progress", "resolved", "closed"):
        return jsonify({"error": "invalid status"}), 400

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id FROM core.support_tickets WHERE id = %s", (ticket_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Ticket not found"}), 404

        cur.execute(
            "UPDATE core.support_tickets SET status = %s, updated_at = now() "
            + ("resolved_at = now() " if new_status == "resolved" else "")
            + "WHERE id = %s RETURNING id, status, updated_at",
            (new_status, ticket_id),
        )
        row = cur.fetchone()
        conn.commit()

        result = {"id": row[0], "status": row[1], "updated_at": str(row[2])}
        cur.close()
        conn.close()
        return jsonify(result)
    except Exception as e:
        logger.error(f"update_ticket_status failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logger.info(f"Starting Products API on {APP_HOST}:{APP_PORT}")
    app.run(host=APP_HOST, port=APP_PORT, debug=False, threaded=True)
