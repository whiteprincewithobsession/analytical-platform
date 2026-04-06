CREATE TABLE core.user_addresses (
    user_id INTEGER NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    address_id BIGINT NOT NULL REFERENCES core.addresses(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    label VARCHAR(64),
    note TEXT,
    PRIMARY KEY (user_id, address_id)
);
