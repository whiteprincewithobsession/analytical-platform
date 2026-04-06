CREATE TABLE core.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(128) NOT NULL UNIQUE,
    phone VARCHAR(32) UNIQUE,
    hashed_password VARCHAR(256) NOT NULL,
    registered_at TIMESTAMP NOT NULL DEFAULT now(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_confirmed BOOLEAN DEFAULT false,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    birthday DATE,
    gender VARCHAR(16),
    preferred_locale VARCHAR(12) DEFAULT 'en',
    timezone VARCHAR(32) DEFAULT 'UTC',
    loyalty_level_id INTEGER REFERENCES system.loyalty_levels(id)
);