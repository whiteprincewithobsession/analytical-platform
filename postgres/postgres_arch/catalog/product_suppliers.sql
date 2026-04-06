CREATE TABLE catalog.product_suppliers (
  id serial PRIMARY KEY,
  product_id int NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  supplier_id int NOT NULL REFERENCES catalog.suppliers(id) ON DELETE CASCADE,
  supplier_sku varchar(64),
  supplier_price numeric(12,2),
  lead_time_days int,
  minimum_order_quantity int,
  active boolean NOT NULL DEFAULT true
);
