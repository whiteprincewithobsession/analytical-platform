CREATE TABLE core.regions (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(32) NOT NULL UNIQUE,  -- 'country_code-town_code'
    region_name VARCHAR(128) NOT NULL,
    country VARCHAR(64) NOT NULL,
    country_code VARCHAR(8),
    timezone VARCHAR(32),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);