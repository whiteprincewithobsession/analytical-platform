CREATE TABLE system.device_types (
    id SERIAL PRIMARY KEY,
    device_code VARCHAR(32) NOT NULL UNIQUE,         -- desktop / mobile / tablet / laptop  ... (uuid?)
    device_name VARCHAR(64) NOT NULL,
    os_family VARCHAR(32),                           -- windows / linux / ios / android / macos
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);