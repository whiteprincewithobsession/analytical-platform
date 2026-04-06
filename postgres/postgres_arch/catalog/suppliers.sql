CREATE TABLE catalog.suppliers (
    id serial PRIMARY KEY,
    code varchar(64) UNIQUE NOT NULL,
    name varchar(128) NOT NULL,
    description text,
    contact_email varchar(256),
    contact_phone varchar(32),
    website varchar(512),
    region_id INTEGER REFERENCES core.regions(id),
    address text,
    active boolean NOT NULL DEFAULT true
);

ALTER TABLE catalog.suppliers
ADD COLUMN region_id INTEGER REFERENCES core.regions(id);
