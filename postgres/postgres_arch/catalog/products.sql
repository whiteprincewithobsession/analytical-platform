CREATE TABLE catalog.products (
  id serial PRIMARY KEY,
  code varchar(64) UNIQUE NOT NULL,
  name varchar(256) NOT NULL,
  description text,
  brand_id int REFERENCES catalog.brands(id) ON DELETE SET NULL,
  category_id int NOT NULL REFERENCES catalog.categories(id) ON DELETE RESTRICT,
  price numeric(12,2) NOT NULL,
  cost numeric(12,2),
  sku varchar(64) UNIQUE NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
