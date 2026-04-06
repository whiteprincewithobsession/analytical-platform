CREATE TABLE system.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action_time TIMESTAMP NOT NULL DEFAULT now(),
    actor_id INTEGER REFERENCES core.users(id),
    actor_role VARCHAR(40),
    object_schema VARCHAR(40) NOT NULL,
    object_table VARCHAR(40) NOT NULL,
    object_id BIGINT,
    action VARCHAR(32) NOT NULL, -- type of action
    changes JSONB, -- change difference
    source_ip VARCHAR(64), -- ip of actor
    user_agent VARCHAR(256),
    extra_info JSONB -- token, trace, ...
);
