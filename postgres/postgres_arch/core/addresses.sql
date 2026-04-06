CREATE TABLE core.addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES core.users(id),
    region_id INTEGER REFERENCES core.regions(id),
    postal_code VARCHAR(16),
    street VARCHAR(128) NOT NULL,
    house VARCHAR(16),
    building VARCHAR(16),
    apartment VARCHAR(32),
    location geometry(Point,4326),
    is_primary BOOLEAN DEFAULT false,
    comment TEXT
);