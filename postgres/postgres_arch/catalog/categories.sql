CREATE TABLE catalog.categories (
  id serial PRIMARY KEY,
  code varchar(64) UNIQUE NOT NULL,
  name varchar(128) NOT NULL,
  description text,
  parent_id int REFERENCES catalog.categories(id) ON DELETE SET NULL,
  slug varchar(256) UNIQUE,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100
);