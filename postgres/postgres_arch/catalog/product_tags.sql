CREATE TABLE catalog.product_tags (
  id serial PRIMARY KEY,
  product_id int NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  tag_id int NOT NULL REFERENCES catalog.tags(id) ON DELETE CASCADE
);