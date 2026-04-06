CREATE TABLE catalog.warehouses (
  id serial PRIMARY KEY,
  code varchar(64) UNIQUE NOT NULL,
  name varchar(128) NOT NULL,
  address text NOT NULL,
  city varchar(100),
  country varchar(100),
  phone varchar(32),
  email varchar(256),
  active boolean NOT NULL DEFAULT true
);