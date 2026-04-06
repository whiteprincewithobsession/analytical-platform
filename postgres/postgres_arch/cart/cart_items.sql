CREATE TABLE cart.cart_items (
  id serial PRIMARY KEY,
  cart_id int NOT NULL REFERENCES cart.cart(id) ON DELETE CASCADE,
  product_id int NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  quantity int NOT NULL,
  price numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);