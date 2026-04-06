CREATE TABLE promo.product_promotions (
    id serial PRIMARY KEY,
    promotion_id int NOT NULL REFERENCES promo.promotions(id) ON DELETE CASCADE,
    product_id int NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    discount_override numeric(12,2),
    priority int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);