CREATE TABLE sales.order_payment (
  id serial PRIMARY KEY,
  order_id bigint NOT NULL UNIQUE REFERENCES sales.orders(id) ON DELETE CASCADE,
  payment_method_code varchar(32) NOT NULL REFERENCES sales.payment_methods(code),
  payment_status_code varchar(32) NOT NULL REFERENCES sales.payment_statuses(code),
  amount numeric(12,2) NOT NULL,
  transaction_id varchar(256),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
