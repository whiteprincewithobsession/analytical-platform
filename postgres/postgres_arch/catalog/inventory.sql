CREATE TABLE catalog.inventory
(
    id BIGSERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL
        REFERENCES catalog.warehouses(id) ON DELETE RESTRICT,
    product_id INTEGER NOT NULL
        REFERENCES catalog.products(id) ON DELETE RESTRICT,
    quantity_available NUMERIC(12, 3) NOT NULL DEFAULT 0,
    quantity_reserved  NUMERIC(12, 3) NOT NULL DEFAULT 0,
    min_stock_level    NUMERIC(12, 3),
    reorder_point      NUMERIC(12, 3),
    last_restock_date  DATE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (warehouse_id, product_id),
    CONSTRAINT inventory_quantities_positive CHECK (
        quantity_available >= 0 AND quantity_reserved >= 0
    )
);