CREATE TABLE system.user_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES core.users(id),
    device_type_id INTEGER REFERENCES system.device_types(id),
    activity_time TIMESTAMP NOT NULL DEFAULT now(),
    activity_type VARCHAR(64) NOT NULL,
    ip_address VARCHAR(64),
    session_id VARCHAR(64)
);
