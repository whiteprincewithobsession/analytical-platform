CREATE OR REPLACE VIEW sales.v_payment_methods_analytics AS
SELECT
    id, code,
    name, description,
    active, created_at, updated_at,
    (meta->>'icon') AS icon,
    (meta->>'fee')::numeric AS fee_percent,
    (meta->>'processing_time') AS processing_time,
    (meta->>'region') AS region,
    (meta->>'blockchain') AS blockchain,
    -- categorisation
    CASE
        WHEN code IN ('cash', 'card', 'debit_card', 'credit_card')
            THEN 'Traditional'
        WHEN code IN ('bank_transfer', 'wire_transfer', 'sepa', 'swift', 'sbp', 'fps')
            OR code LIKE '%bank%transfer%'
            THEN 'Banking'
        WHEN code IN ('paypal', 'qiwi', 'yoomoney', 'webmoney', 'skrill', 'neteller',
                      'payoneer', 'stripe', 'square', 'venmo', 'zelle', 'cashapp')
            THEN 'E-Wallets'
        WHEN code IN ('apple_pay', 'google_pay', 'samsung_pay', 'alipay',
                      'wechat_pay', 'paytm', 'phonepe', 'gpay_india')
            THEN 'Mobile Payments'
        WHEN code IN ('bitcoin', 'ethereum', 'usdt', 'usdc', 'litecoin', 'ripple',
                      'cardano', 'solana', 'bnb', 'polygon', 'dogecoin', 'ton')
            OR meta->>'blockchain' IS NOT NULL
            THEN 'Crypto'
        WHEN code IN ('ideal', 'giropay', 'sofort', 'bancontact', 'eps',
                      'przelewy24', 'multibanco', 'mercadopago', 'pix', 'boleto',
                      'oxxo', 'grabpay', 'kakao_pay', 'naver_pay', 'line_pay',
                      'rakuten_pay', 'paypay')
            THEN 'Regional Systems'
        WHEN code IN ('klarna', 'afterpay', 'affirm', 'sezzle', 'splitit')
            OR code LIKE '%installment%'
            OR (meta->>'installments')::boolean = true
            THEN 'BNPL'
        WHEN code IN ('gift_card', 'voucher', 'promo_code', 'loyalty_points', 'store_credit')
            THEN 'Rewards & Vouchers'
        WHEN code IN ('invoice', 'letter_of_credit', 'offset', 'escrow')
            OR (meta->>'b2b')::boolean = true
            THEN 'Business/B2B'
        WHEN code IN ('cod', 'check', 'money_order')
            THEN 'Cash on Delivery'
        WHEN code IN ('direct_debit', 'ach', 'e_transfer')
            THEN 'Direct Debit'
        WHEN code IN ('mobile_billing', 'mts_payment', 'beeline_payment',
                      'megafon_payment', 'tele2_payment')
            THEN 'Carrier Billing'
        WHEN code IN ('tinkoff_pay', 'sberbank_online', 'alfa_pay',
                      'vtb_pay', 'raiffeisen_pay')
            OR code LIKE '%_online'
            THEN 'Bank Apps'
        WHEN code IN ('atm_cash', 'terminal', 'pos_terminal')
            THEN 'Terminals & ATM'
        WHEN code IN ('nfc_payment', 'qr_payment', 'biometric_payment',
                      'smart_watch', 'voice_payment', 'iot_payment')
            OR (meta->>'contactless')::boolean = true
            OR (meta->>'biometric')::boolean = true
            THEN 'Alternative/Contactless'
        WHEN code IN ('barter')
            THEN 'Barter/Special'
        ELSE 'Other'
    END AS payment_category,
    -- process speed
    CASE
        WHEN meta->>'processing_time' = 'instant' THEN 'Instant'
        WHEN meta->>'processing_time' LIKE '%sec%' THEN 'Seconds'
        WHEN meta->>'processing_time' LIKE '%min%' THEN 'Minutes'
        WHEN meta->>'processing_time' LIKE '%hour%' THEN 'Hours'
        WHEN meta->>'processing_time' LIKE '%day%' THEN 'Days'
        ELSE 'Manual'
    END AS speed_category,
    -- commission level
    CASE
        WHEN (meta->>'fee')::numeric = 0 THEN 'Free'
        WHEN (meta->>'fee')::numeric < 2 THEN 'Low (< 2%)'
        WHEN (meta->>'fee')::numeric < 4 THEN 'Medium (2-4%)'
        ELSE 'High (> 4%)'
    END AS fee_category,
    -- opportunities
    (meta->>'installments')::boolean AS has_installments,
    (meta->>'recurring')::boolean AS supports_recurring,
    (meta->>'b2b')::boolean AS is_b2b,
    (meta->>'stablecoin')::boolean AS is_stablecoin,
    (meta->>'contactless')::boolean AS is_contactless,
    (meta->>'biometric')::boolean AS supports_biometric,
    COALESCE(meta->>'region', 'Global') AS service_region,
    -- how much exists in system
    EXTRACT(DAY FROM NOW() - created_at) AS days_since_created,
    -- last activity
    CASE
        WHEN updated_at > NOW() - INTERVAL '30 days' THEN 'Recent'
        WHEN updated_at > NOW() - INTERVAL '90 days' THEN 'Moderate'
        ELSE 'Old'
    END AS update_recency
FROM sales.payment_methods;