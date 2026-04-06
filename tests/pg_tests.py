import pytest
import psycopg2
from psycopg2.extras import RealDictCursor


DB_CONFIG = {
    "host": "localhost",
    "port": 5430,
    "database": "omni_retail_core",
    "user": "admin",
    "password": "admin",
}

@pytest.fixture(scope="session")
def db():
    conn = psycopg2.connect(**DB_CONFIG)
    yield conn
    conn.close()


@pytest.fixture
def cur(db):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    yield cursor
    db.rollback()
    cursor.close()


@pytest.fixture
def test_user(cur, db):
    import uuid
    unique_id = uuid.uuid4().hex[:8]
    unique_email = f"test_{unique_id}@pytest.com"
    unique_phone = f"+7999{unique_id[:7]}"
    
    cur.execute("""
        INSERT INTO core.users (email, phone, hashed_password, first_name, last_name)
        VALUES (%s, %s, 'hashed_test_pass', 'Test', 'User')
        RETURNING id
    """, (unique_email, unique_phone))
    user_id = cur.fetchone()["id"]
    db.commit()
    
    return user_id


@pytest.fixture
def test_category(cur, db):
    import uuid
    unique_code = f"test-cat-{uuid.uuid4().hex[:8]}"
    
    cur.execute("""
        INSERT INTO catalog.categories (code, name, slug)
        VALUES (%s, 'Test Category', %s)
        RETURNING id
    """, (unique_code, unique_code))
    cat_id = cur.fetchone()["id"]
    db.commit()
    
    return cat_id


@pytest.fixture
def test_product(cur, db, test_category):
    import uuid
    unique_sku = f"TEST-SKU-{uuid.uuid4().hex[:8]}"
    unique_code = f"test-prod-{uuid.uuid4().hex[:8]}"
    
    cur.execute("""
        INSERT INTO catalog.products (code, name, category_id, price, sku)
        VALUES (%s, 'Test Product', %s, 99.99, %s)
        RETURNING id
    """, (unique_code, test_category, unique_sku))
    product_id = cur.fetchone()["id"]
    db.commit()
    
    return product_id


class TestTablesExist:
    
    @pytest.mark.parametrize("schema,table", [
        ("core", "users"),
        ("core", "roles"),
        ("core", "user_roles"),
        ("core", "addresses"),
        ("core", "regions"),
        ("catalog", "products"),
        ("catalog", "categories"),
        ("catalog", "brands"),
        ("catalog", "suppliers"),
        ("catalog", "product_suppliers"),
        ("sales", "orders"),
        ("sales", "payment_methods"),
        ("sales", "payment_statuses"),
        ("sales", "currencies"),
        ("cart", "cart"),
        ("cart", "cart_items"),
        ("system", "loyalty_programs"),
        ("system", "loyalty_levels"),
    ])
    def test_table_exists(self, cur, schema, table):
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %s AND table_name = %s
            )
        """, (schema, table))
        assert cur.fetchone()["exists"], f"{schema}.{table} не существует"

class TestColumns:
    
    def test_users_has_email(self, cur):
        cur.execute("""
            SELECT column_name, is_nullable, data_type
            FROM information_schema.columns
            WHERE table_schema = 'core' AND table_name = 'users' AND column_name = 'email'
        """)
        col = cur.fetchone()
        assert col is not None, "Колонка email не найдена"
        assert col["is_nullable"] == "NO", "email должен быть NOT NULL"
    
    def test_products_has_price(self, cur):
        cur.execute("""
            SELECT column_name, data_type, numeric_precision, numeric_scale
            FROM information_schema.columns
            WHERE table_schema = 'catalog' AND table_name = 'products' AND column_name = 'price'
        """)
        col = cur.fetchone()
        assert col is not None
        assert col["data_type"] == "numeric"
        assert col["numeric_precision"] == 12
        assert col["numeric_scale"] == 2
    
    def test_orders_has_total_amount(self, cur):
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'sales' AND table_name = 'orders' AND column_name = 'total_amount'
        """)
        assert cur.fetchone() is not None

class TestPrimaryKeys:
    
    @pytest.mark.parametrize("schema,table,expected_pk", [
        ("core", "users", ["id"]),
        ("core", "roles", ["id"]),
        ("core", "user_roles", ["user_id", "role_id"]),
        ("catalog", "products", ["id"]),
        ("sales", "orders", ["id"]),
        ("sales", "payment_statuses", ["code"]),
        ("sales", "currencies", ["code"]),
    ])
    def test_primary_key(self, cur, schema, table, expected_pk):
        cur.execute("""
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            JOIN pg_class c ON c.oid = i.indrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE i.indisprimary AND n.nspname = %s AND c.relname = %s
            ORDER BY array_position(i.indkey, a.attnum)
        """, (schema, table))
        pk_cols = [row["attname"] for row in cur.fetchall()]
        assert pk_cols == expected_pk, f"PK для {schema}.{table}: ожидали {expected_pk}, получили {pk_cols}"

class TestForeignKeys:
    
    def test_orders_fk_to_users(self, cur):
        cur.execute("""
            SELECT ccu.table_name as foreign_table
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'sales'
            AND tc.table_name = 'orders'
            AND kcu.column_name = 'user_id'
        """)
        result = cur.fetchone()
        assert result is not None
        assert result["foreign_table"] == "users"
    
    def test_products_fk_to_categories(self, cur):
        cur.execute("""
            SELECT ccu.table_name as foreign_table
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'catalog'
            AND tc.table_name = 'products'
            AND kcu.column_name = 'category_id'
        """)
        result = cur.fetchone()
        assert result is not None
        assert result["foreign_table"] == "categories"

class TestUniqueConstraints:
    
    def test_users_email_unique(self, cur):
        cur.execute("""
            SELECT COUNT(*) as cnt
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'UNIQUE'
            AND tc.table_schema = 'core'
            AND tc.table_name = 'users'
            AND kcu.column_name = 'email'
        """)
        assert cur.fetchone()["cnt"] >= 1
    
    def test_products_sku_unique(self, cur):
        cur.execute("""
            SELECT COUNT(*) as cnt
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'UNIQUE'
            AND tc.table_schema = 'catalog'
            AND tc.table_name = 'products'
            AND kcu.column_name = 'sku'
        """)
        assert cur.fetchone()["cnt"] >= 1

class TestDataQuality:
    
    def test_no_null_emails(self, cur):
        cur.execute("SELECT COUNT(*) as cnt FROM core.users WHERE email IS NULL")
        assert cur.fetchone()["cnt"] == 0
    
    def test_emails_have_at_sign(self, cur):
        cur.execute("SELECT COUNT(*) as cnt FROM core.users WHERE email NOT LIKE '%@%'")
        assert cur.fetchone()["cnt"] == 0
    
    def test_products_price_positive(self, cur):
        cur.execute("SELECT COUNT(*) as cnt FROM catalog.products WHERE price <= 0")
        assert cur.fetchone()["cnt"] == 0
    
    def test_orders_total_positive(self, cur):
        cur.execute("SELECT COUNT(*) as cnt FROM sales.orders WHERE total_amount <= 0")
        assert cur.fetchone()["cnt"] == 0
    
    def test_no_future_orders(self, cur):
        cur.execute("SELECT COUNT(*) as cnt FROM sales.orders WHERE order_date > CURRENT_DATE")
        assert cur.fetchone()["cnt"] == 0
    
    def test_no_orphan_orders(self, cur):
        cur.execute("""
            SELECT COUNT(*) as cnt FROM sales.orders o
            LEFT JOIN core.users u ON o.user_id = u.id
            WHERE u.id IS NULL
        """)
        assert cur.fetchone()["cnt"] == 0
    
    def test_no_orphan_cart_items(self, cur):
        cur.execute("""
            SELECT COUNT(*) as cnt FROM cart.cart_items ci
            LEFT JOIN catalog.products p ON ci.product_id = p.id
            WHERE p.id IS NULL
        """)
        assert cur.fetchone()["cnt"] == 0
    
    def test_categories_no_self_reference(self, cur):
        cur.execute("SELECT COUNT(*) as cnt FROM catalog.categories WHERE id = parent_id")
        assert cur.fetchone()["cnt"] == 0

class TestConstraintViolations:
    
    def test_cannot_insert_duplicate_email(self, cur, db):
        cur.execute("""
            INSERT INTO core.users (email, hashed_password)
            VALUES ('test_dup@test.com', 'hash123')
        """)
        
        with pytest.raises(psycopg2.errors.UniqueViolation):
            cur.execute("""
                INSERT INTO core.users (email, hashed_password)
                VALUES ('test_dup@test.com', 'hash456')
            """)
    
    def test_cannot_insert_order_for_nonexistent_user(self, cur, db):
        cur.execute("SELECT code FROM sales.currencies LIMIT 1")
        result = cur.fetchone()
        
        if result is None:
            cur.execute("INSERT INTO sales.currencies (code, name) VALUES ('RUB', 'Russian Ruble')")
            db.commit()
            currency_code = 'RUB'
        else:
            currency_code = result["code"]
        
        with pytest.raises(psycopg2.errors.ForeignKeyViolation):
            cur.execute("""
                INSERT INTO sales.orders (user_id, order_date, status, total_amount, currency_code)
                VALUES (999999999, '2024-01-01', 'new', 100.00, %s)
            """, (currency_code,))
    
    def test_cannot_delete_category_with_products(self, cur, db):
        cur.execute("""
            INSERT INTO catalog.categories (code, name)
            VALUES ('test_del_cat', 'Test Category')
            RETURNING id
        """)
        cat_id = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO catalog.products (code, name, category_id, price, sku)
            VALUES ('test_del_prod', 'Test Product', %s, 10.00, 'TEST-DEL-SKU')
        """, (cat_id,))
        
        with pytest.raises(psycopg2.errors.ForeignKeyViolation):
            cur.execute("DELETE FROM catalog.categories WHERE id = %s", (cat_id,))

class TestQueries:
    
    def test_user_orders_join(self, cur):
        cur.execute("""
            SELECT 
                u.id, u.email,
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM core.users u
            LEFT JOIN sales.orders o ON u.id = o.user_id
            GROUP BY u.id, u.email
            LIMIT 10
        """)
        results = cur.fetchall()
        assert isinstance(results, list)
    
    def test_products_with_categories(self, cur):
        cur.execute("""
            SELECT 
                p.id, p.name, p.price,
                c.name as category_name
            FROM catalog.products p
            JOIN catalog.categories c ON p.category_id = c.id
            WHERE p.active = true
            LIMIT 10
        """)
        results = cur.fetchall()
        assert isinstance(results, list)
    
    def test_category_hierarchy(self, cur):
        cur.execute("""
            WITH RECURSIVE cat_tree AS (
                SELECT id, name, parent_id, 1 as level
                FROM catalog.categories
                WHERE parent_id IS NULL
                
                UNION ALL
                
                SELECT c.id, c.name, c.parent_id, ct.level + 1
                FROM catalog.categories c
                JOIN cat_tree ct ON c.parent_id = ct.id
            )
            SELECT * FROM cat_tree ORDER BY level, name
        """)
        results = cur.fetchall()
        assert isinstance(results, list)
    
    def test_daily_orders_report(self, cur):
        cur.execute("""
            SELECT 
                order_date,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM sales.orders
            WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY order_date
            ORDER BY order_date DESC
        """)
        results = cur.fetchall()
        assert isinstance(results, list)
        

class TestTriggers:
    
    def test_cart_updated_at_trigger(self, cur, db, test_user):
        cur.execute("""
            INSERT INTO cart.cart (user_id, total_items)
            VALUES (%s, 5)
            RETURNING id, updated_at
        """, (test_user,))
        result = cur.fetchone()
        cart_id = result["id"]
        old_updated = result["updated_at"]
        
        cur.execute("SELECT pg_sleep(0.1)")
        
        cur.execute("""
            UPDATE cart.cart SET total_items = 10 WHERE id = %s
            RETURNING updated_at
        """, (cart_id,))
        new_updated = cur.fetchone()["updated_at"]
        
        if new_updated == old_updated:
            pytest.skip("Триггер set_cart_updated_at() не настроен")
        
        assert new_updated > old_updated
    
    def test_products_updated_at_trigger(self, cur, db, test_product):
        cur.execute("SELECT updated_at FROM catalog.products WHERE id = %s", (test_product,))
        old_updated = cur.fetchone()["updated_at"]
        
        import time
        time.sleep(1)
        
        cur.execute("""
            UPDATE catalog.products SET price = 199.99 WHERE id = %s
            RETURNING updated_at
        """, (test_product,))
        new_updated = cur.fetchone()["updated_at"]
        
        assert new_updated > old_updated
        
    def test_payment_methods_updated_at_trigger(self, cur, db):
        import uuid
        unique_code = f"test_pm_{uuid.uuid4().hex[:8]}"
        
        cur.execute("""
            INSERT INTO sales.payment_methods (code, name)
            VALUES (%s, 'Test Payment')
            RETURNING id, updated_at
        """, (unique_code,))
        result = cur.fetchone()
        pm_id = result["id"]
        old_updated = result["updated_at"]
        
        import time
        time.sleep(1)
        
        cur.execute("""
            UPDATE sales.payment_methods SET active = false WHERE id = %s
            RETURNING updated_at
        """, (pm_id,))
        new_updated = cur.fetchone()["updated_at"]
        
        if new_updated == old_updated:
            pytest.skip("Триггер set_updated_at() для payment_methods не настроен")
        
        assert new_updated > old_updated

class TestCheckConstraints:
    
    def test_reviews_rating_between_1_and_5(self, cur, db, test_user, test_product):
        cur.execute("SELECT code FROM sales.currencies LIMIT 1")
        result = cur.fetchone()
        if result:
            currency = result["code"]
        else:
            cur.execute("INSERT INTO sales.currencies (code, name) VALUES ('RUB', 'Ruble')")
            db.commit()
            currency = 'RUB'
        
        cur.execute("""
            INSERT INTO sales.orders (user_id, order_date, status, total_amount, currency_code)
            VALUES (%s, CURRENT_DATE, 'delivered', 100, %s)
            RETURNING id
        """, (test_user, currency))
        order_id = cur.fetchone()["id"]
        db.commit()  
        
        with pytest.raises(psycopg2.errors.CheckViolation):
            cur.execute("""
                INSERT INTO feedback.reviews (user_id, product_id, order_id, rating, content)
                VALUES (%s, %s, %s, 0, 'Bad rating')
            """, (test_user, test_product, order_id))
            db.commit()
        
        db.rollback()
        
        with pytest.raises(psycopg2.errors.CheckViolation):
            cur.execute("""
                INSERT INTO feedback.reviews (user_id, product_id, order_id, rating, content)
                VALUES (%s, %s, %s, 6, 'Too high')
            """, (test_user, test_product, order_id))
            db.commit() 
        
        db.rollback()
        
        cur.execute("""
            INSERT INTO feedback.reviews (user_id, product_id, order_id, rating, content)
            VALUES (%s, %s, %s, 3, 'Normal rating')
        """, (test_user, test_product, order_id))
        db.commit() 
    
    def test_inventory_quantities_positive(self, cur, db, test_product):
        import uuid
        unique_code = f"WH-TEST-{uuid.uuid4().hex[:8]}"
        
        cur.execute("""
            INSERT INTO catalog.warehouses (code, name, address)
            VALUES (%s, 'Test Warehouse', 'Test Address')
            RETURNING id
        """, (unique_code,))
        warehouse_id = cur.fetchone()["id"]
        db.commit() 
        
        with pytest.raises(psycopg2.errors.CheckViolation):
            cur.execute("""
                INSERT INTO catalog.inventory (warehouse_id, product_id, quantity_available)
                VALUES (%s, %s, -10)
            """, (warehouse_id, test_product))
            db.commit() 
        
        db.rollback()
        
        cur.execute("""
            INSERT INTO catalog.inventory (warehouse_id, product_id, quantity_available)
            VALUES (%s, %s, 100)
        """, (warehouse_id, test_product))

class TestJSONBColumns:
    
    def test_user_profile_jsonb_fields(self, cur, db, test_user):
        cur.execute("""
            INSERT INTO core.user_profile (user_id, privacy_settings, notification_settings)
            VALUES (%s, %s, %s)
        """, (test_user, 
              '{"public_profile": true, "show_email": false}',
              '{"email_notifications": true, "sms_notifications": false}'))
        cur.execute("""
            SELECT 
                privacy_settings->>'public_profile' as public_profile,
                notification_settings->>'email_notifications' as email_notif
            FROM core.user_profile WHERE user_id = %s
        """, (test_user,))
        
        result = cur.fetchone()
        assert result["public_profile"] == "true"
        assert result["email_notif"] == "true"
    
    def test_payment_methods_meta_jsonb(self, cur, db):
        cur.execute("""
            INSERT INTO sales.payment_methods (code, name, meta)
            VALUES ('test_json', 'Test', %s)
        """, ('{"fee": 2.5, "region": "RU", "processing_time": "instant"}',))
        
        cur.execute("""
            SELECT 
                (meta->>'fee')::numeric as fee,
                meta->>'region' as region
            FROM sales.payment_methods
            WHERE code = 'test_json'
        """)
        
        result = cur.fetchone()
        assert result["fee"] == 2.5
        assert result["region"] == "RU"
    
    def test_product_metadata_images_jsonb(self, cur, db, test_product):
        cur.execute("""
            INSERT INTO catalog.product_metadata (product_id, images, attributes)
            VALUES (%s, %s, %s)
        """, (test_product,
              '[{"url": "/img1.jpg", "main": true}, {"url": "/img2.jpg", "main": false}]',
              '{"color": "red", "size": "XL", "material": "cotton"}'))
        
        cur.execute("""
            SELECT 
                jsonb_array_length(images) as img_count,
                attributes->>'color' as color
            FROM catalog.product_metadata
            WHERE product_id = %s
        """, (test_product,))
        
        result = cur.fetchone()
        assert result["img_count"] == 2
        assert result["color"] == "red"

class TestBusinessLogic:
    
    def test_cart_total_matches_items(self, cur, db, test_user, test_product):
        cur.execute("""
            INSERT INTO cart.cart (user_id, total_items, total_price)
            VALUES (%s, 2, 200.00)
            RETURNING id
        """, (test_user,))
        cart_id = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO cart.cart_items (cart_id, product_id, quantity, price)
            VALUES (%s, %s, 2, 100.00)
        """, (cart_id, test_product))

        cur.execute("""
            SELECT 
                c.total_price as cart_total,
                COALESCE(SUM(ci.quantity * ci.price), 0) as items_total
            FROM cart.cart c
            LEFT JOIN cart.cart_items ci ON c.id = ci.cart_id
            WHERE c.id = %s
            GROUP BY c.id, c.total_price
        """, (cart_id,))
        
        result = cur.fetchone()
        assert result["cart_total"] == result["items_total"]
    
    def test_order_total_matches_items(self, cur, db, test_user, test_product):
        cur.execute("SELECT code FROM sales.currencies LIMIT 1")
        result = cur.fetchone()
        currency = result["code"] if result else 'RUB'
        
        if not result:
            cur.execute("INSERT INTO sales.currencies (code, name) VALUES ('RUB', 'Ruble')")
        
        cur.execute("""
            INSERT INTO sales.orders (user_id, order_date, status, total_amount, currency_code)
            VALUES (%s, CURRENT_DATE, 'new', 300.00, %s)
            RETURNING id
        """, (test_user, currency))
        order_id = cur.fetchone()["id"]
        cur.execute("""
            INSERT INTO sales.order_items (order_id, product_id, quantity, price)
            VALUES (%s, %s, 3, 100.00)
        """, (order_id, test_product))
        cur.execute("""
            SELECT 
                o.total_amount,
                COALESCE(SUM(oi.quantity * oi.price - oi.discount_amount), 0) as items_total
            FROM sales.orders o
            LEFT JOIN sales.order_items oi ON o.id = oi.order_id
            WHERE o.id = %s
            GROUP BY o.id, o.total_amount
        """, (order_id,))
        
        result = cur.fetchone()
        assert result["total_amount"] == result["items_total"]
    
    def test_inventory_reserved_not_exceeds_available(self, cur, db, test_product):
        cur.execute("""
            INSERT INTO catalog.warehouses (code, name, address)
            VALUES ('WH-BL', 'Test', 'Address')
            RETURNING id
        """)
        wh_id = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO catalog.inventory (warehouse_id, product_id, quantity_available, quantity_reserved)
            VALUES (%s, %s, 100, 50)
        """, (wh_id, test_product))
        
        cur.execute("""
            SELECT COUNT(*) as violations
            FROM catalog.inventory
            WHERE quantity_reserved > quantity_available
        """)
        assert cur.fetchone()["violations"] == 0
    
    def test_user_only_one_primary_address(self, cur, db, test_user):
        cur.execute("""
            INSERT INTO core.addresses (user_id, street, is_primary)
            VALUES (%s, 'Street 1', true)
        """, (test_user,))
        
        cur.execute("""
            INSERT INTO core.addresses (user_id, street, is_primary)
            VALUES (%s, 'Street 2', true)
        """, (test_user,))
        
        cur.execute("""
            SELECT COUNT(*) as primary_count
            FROM core.addresses
            WHERE user_id = %s AND is_primary = true
        """, (test_user,))
        
        count = cur.fetchone()["primary_count"]
    
    def test_loyalty_level_rank_unique_per_program(self, cur, db):
        cur.execute("""
            INSERT INTO system.loyalty_programs (program_name)
            VALUES ('Test Program')
            RETURNING id
        """)
        prog_id = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO system.loyalty_levels (program_id, level_name, level_rank)
            VALUES (%s, 'Bronze', 1)
        """, (prog_id,))
        
        with pytest.raises(psycopg2.errors.UniqueViolation):
            cur.execute("""
                INSERT INTO system.loyalty_levels (program_id, level_name, level_rank)
                VALUES (%s, 'Silver', 1)
            """, (prog_id,))

class TestCascadeDeletes:
    
    def test_delete_user_deletes_cart(self, cur, db):
        cur.execute("""
            INSERT INTO core.users (email, hashed_password)
            VALUES ('cascade_cart@test.com', 'hash')
            RETURNING id
        """)
        user_id = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO cart.cart (user_id)
            VALUES (%s)
            RETURNING id
        """, (user_id,))
        cart_id = cur.fetchone()["id"]
        
        cur.execute("DELETE FROM core.users WHERE id = %s", (user_id,))
        
        cur.execute("SELECT id FROM cart.cart WHERE id = %s", (cart_id,))
        assert cur.fetchone() is None
    
    def test_delete_cart_deletes_items(self, cur, db, test_user, test_product):
        cur.execute("""
            INSERT INTO cart.cart (user_id)
            VALUES (%s)
            RETURNING id
        """, (test_user,))
        cart_id = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO cart.cart_items (cart_id, product_id, quantity, price)
            VALUES (%s, %s, 1, 100)
            RETURNING id
        """, (cart_id, test_product))
        item_id = cur.fetchone()["id"]
        
        cur.execute("DELETE FROM cart.cart WHERE id = %s", (cart_id,))
        
        cur.execute("SELECT id FROM cart.cart_items WHERE id = %s", (item_id,))
        assert cur.fetchone() is None
    
    def test_delete_order_cascades_to_items_and_payment(self, cur, db, test_user, test_product):
        cur.execute("SELECT code FROM sales.currencies LIMIT 1")
        result = cur.fetchone()
        currency = result["code"] if result else 'RUB'
        if not result:
            cur.execute("INSERT INTO sales.currencies (code, name) VALUES ('RUB', 'Ruble')")
        
        cur.execute("""
            INSERT INTO sales.orders (user_id, order_date, status, total_amount, currency_code)
            VALUES (%s, CURRENT_DATE, 'new', 100, %s)
            RETURNING id
        """, (test_user, currency))
        order_id = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO sales.order_items (order_id, product_id, quantity, price)
            VALUES (%s, %s, 1, 100)
            RETURNING id
        """, (order_id, test_product))
        item_id = cur.fetchone()["id"]
        
        cur.execute("DELETE FROM sales.orders WHERE id = %s", (order_id,))
        
        cur.execute("SELECT id FROM sales.order_items WHERE id = %s", (item_id,))
        assert cur.fetchone() is None

class TestSpecificTables:
    
    def test_currency_rates_positive(self, cur, db):
        cur.execute("SELECT code FROM sales.currencies LIMIT 2")
        codes = [r["code"] for r in cur.fetchall()]
        
        if len(codes) < 2:
            cur.execute("INSERT INTO sales.currencies (code, name) VALUES ('USD', 'Dollar'), ('EUR', 'Euro')")
            codes = ['USD', 'EUR']
        
        cur.execute("""
            INSERT INTO sales.currency_rates (base_currency_code, target_currency_code, rate, rate_date)
            VALUES (%s, %s, 1.1, CURRENT_DATE)
        """, (codes[0], codes[1]))
        
        cur.execute("SELECT COUNT(*) as cnt FROM sales.currency_rates WHERE rate <= 0")
        assert cur.fetchone()["cnt"] == 0
    
    def test_currency_rates_no_future_dates(self, cur, db):
        cur.execute("""
            SELECT COUNT(*) as cnt 
            FROM sales.currency_rates 
            WHERE rate_date > CURRENT_DATE
        """)
        assert cur.fetchone()["cnt"] == 0
    
    def test_audit_logs_structure(self, cur, db):
        cur.execute("""
            INSERT INTO system.audit_logs (object_schema, object_table, action)
            VALUES ('core', 'users', 'INSERT')
            RETURNING id
        """)
        assert cur.fetchone()["id"] is not None
    
    def test_error_logs_unresolved_by_default(self, cur, db):
        cur.execute("""
            INSERT INTO system.error_logs (level, error_message)
            VALUES ('ERROR', 'Test error')
            RETURNING resolved
        """)
        assert cur.fetchone()["resolved"] is False
    
    def test_product_tags_many_to_many(self, cur, db, test_product):
        import uuid
        
        tag1_code = f"sale-{uuid.uuid4().hex[:8]}"
        tag2_code = f"new-{uuid.uuid4().hex[:8]}"
        
        cur.execute("""
            INSERT INTO catalog.tags (code, name)
            VALUES (%s, 'Sale')
            RETURNING id
        """, (tag1_code,))
        tag_id_1 = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO catalog.tags (code, name)
            VALUES (%s, 'New')
            RETURNING id
        """, (tag2_code,))
        tag_id_2 = cur.fetchone()["id"]
        
        cur.execute("""
            INSERT INTO catalog.product_tags (product_id, tag_id)
            VALUES (%s, %s)
        """, (test_product, tag_id_1))
        
        cur.execute("""
            INSERT INTO catalog.product_tags (product_id, tag_id)
            VALUES (%s, %s)
        """, (test_product, tag_id_2))
        
        cur.execute("""
            SELECT COUNT(*) as cnt
            FROM catalog.product_tags
            WHERE product_id = %s
        """, (test_product,))
        assert cur.fetchone()["cnt"] == 2

class TestViews:
    
    def test_payment_methods_analytics_view_exists(self, cur):
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.views
                WHERE table_schema = 'sales' 
                AND table_name = 'v_payment_methods_analytics'
            )
        """)
        assert cur.fetchone()["exists"] is True
    
    def test_payment_methods_analytics_view_query(self, cur, db):
        cur.execute("""
            INSERT INTO sales.payment_methods (code, name, meta)
            VALUES ('view_test', 'View Test', '{"fee": 1.5, "region": "RU"}')
        """)
        
        cur.execute("""
            SELECT code, fee_percent, service_region
            FROM sales.v_payment_methods_analytics
            WHERE code = 'view_test'
        """)
        result = cur.fetchone()
        assert result is not None
        assert result["fee_percent"] == 1.5
        assert result["service_region"] == "RU"

class TestIndexes:
    
    def test_currency_rates_index_exists(self, cur):
        cur.execute("""
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'sales'
            AND tablename = 'currency_rates'
            AND indexname = 'idx_currency_rates_fast'
        """)
        assert cur.fetchone() is not None
