CREATE TABLE core.user_profile (
    user_id INTEGER PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(256),
    bio TEXT,
    telegram_handle VARCHAR(64),
    privacy_settings JSONB,
    notification_settings JSONB,
    extra JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

