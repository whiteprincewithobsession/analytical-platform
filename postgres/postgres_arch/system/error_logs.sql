CREATE TABLE system.error_logs (
    id BIGSERIAL PRIMARY KEY,
    event_time TIMESTAMP NOT NULL DEFAULT now(),
    level VARCHAR(16) NOT NULL, -- ERROR / WARNING / INFO / DEBUG
    service_name VARCHAR(40), -- name of schema
    user_id INTEGER REFERENCES core.users(id),
    error_code VARCHAR(40),
    error_message TEXT NOT NULL,
    request_data JSONB,
    stacktrace TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolution_note TEXT
);
