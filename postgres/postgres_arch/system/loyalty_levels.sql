CREATE TABLE system.loyalty_levels (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES system.loyalty_programs(id),
    level_name VARCHAR(32) NOT NULL,
    level_rank INTEGER NOT NULL,
    min_total_amount NUMERIC(14,2) DEFAULT 0.00,
    min_orders_count INTEGER DEFAULT 0,
    discount_percent NUMERIC(4,2) DEFAULT 0.00,
    cashback_percent NUMERIC(4,2) DEFAULT 0.00,
    perks JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(program_id, level_rank),
    UNIQUE(program_id, level_name)
);
