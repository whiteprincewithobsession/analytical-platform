CREATE TABLE sales.order_status_history (
  id serial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  old_status varchar(32),
  new_status varchar(32) NOT NULL,
  changed_by int REFERENCES core.users(id) ON DELETE SET NULL,
  change_source varchar(32),
  change_time timestamptz NOT NULL DEFAULT now()
);
