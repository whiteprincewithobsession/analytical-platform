CREATE TABLE system.user_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    device_type_id INTEGER NOT NULL REFERENCES system.device_types(id),
    serial_number VARCHAR(128) NOT NULL,
    device_name VARCHAR(128),
    os_version VARCHAR(64),
    browser VARCHAR(64),
    ip_address VARCHAR(64),
    registered_at TIMESTAMP NOT NULL DEFAULT now(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    extra JSONB,
    UNIQUE (user_id, serial_number)
);

