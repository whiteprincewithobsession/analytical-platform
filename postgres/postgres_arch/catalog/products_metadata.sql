CREATE TABLE catalog.product_metadata (
  product_id int PRIMARY KEY REFERENCES catalog.products(id) ON DELETE CASCADE,
  attributes jsonb,
  images jsonb,
  videos jsonb,
  documents jsonb,
  weight numeric(8,3),
  width numeric(8,3),
  height numeric(8,3),
  depth numeric(8,3),
  color varchar(64),
  material varchar(128),
  country_of_origin varchar(100),
  manufacturer varchar(128)
);
