CREATE TABLE sales.currency_rates (
    id                  serial PRIMARY KEY,
    base_currency_code  varchar(8) NOT NULL REFERENCES sales.currencies(code), -- from
    target_currency_code varchar(8) NOT NULL REFERENCES sales.currencies(code), -- to
    rate                numeric(18,8) NOT NULL,                 -- 1 base = rate target
    rate_date           date NOT NULL,
    source              varchar(64)
);

