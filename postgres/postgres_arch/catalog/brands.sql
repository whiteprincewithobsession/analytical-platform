CREATE TABLE catalog.brands (
  id serial PRIMARY KEY,
  code varchar(64) UNIQUE NOT NULL,
  name varchar(128) NOT NULL,
  description text,
  logo_url varchar(512),
  website varchar(512),
  country varchar(100),
  active boolean NOT NULL DEFAULT true
);