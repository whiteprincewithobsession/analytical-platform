CREATE TABLE cart.cart (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  session_id varchar(256),
  total_items int NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);