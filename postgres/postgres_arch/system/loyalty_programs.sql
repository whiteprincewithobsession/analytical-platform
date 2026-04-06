CREATE TABLE system.loyalty_programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(64) NOT NULL,
    program_id INTEGER REFERENCES system.loyalty_programs(id),
    description TEXT,
    brand_id INTEGER,
    region VARCHAR(64),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    rules JSONB, -- set of rules in json like a type of goods, white-black list, ...
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE system.loyalty_programs
    DROP COLUMN region,
    ADD COLUMN region_id INTEGER REFERENCES core.regions(id);

ALTER TABLE system.loyalty_programs
    ADD CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES catalog.brands(id);