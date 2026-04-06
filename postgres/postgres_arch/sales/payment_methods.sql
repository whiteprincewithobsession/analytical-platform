CREATE TABLE sales.payment_methods (
    id                serial PRIMARY KEY,
    code              varchar(32) UNIQUE NOT NULL, -- cash / card / ...
    name              varchar(100) NOT NULL,
    description       text,
    active            boolean NOT NULL DEFAULT true,
    meta              jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION sales.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_methods_set_updated
BEFORE UPDATE ON sales.payment_methods
FOR EACH ROW
EXECUTE FUNCTION sales.set_updated_at();