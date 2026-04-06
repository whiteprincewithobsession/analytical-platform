CREATE TABLE sales.order_items (
  id serial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  product_id int NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
  quantity int NOT NULL,
  price numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now()
);
