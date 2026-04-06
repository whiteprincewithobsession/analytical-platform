CREATE INDEX idx_currency_rates_fast
    ON sales.currency_rates (rate_date DESC, base_currency_code, target_currency_code);
