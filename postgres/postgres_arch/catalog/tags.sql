CREATE TABLE catalog.tags (
  id serial PRIMARY KEY,
  code varchar(64) UNIQUE NOT NULL,
  name varchar(128) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true
);