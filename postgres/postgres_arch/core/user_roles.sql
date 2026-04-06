CREATE TABLE core.user_roles (
    user_id INTEGER NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT now(),
    assigned_by INTEGER REFERENCES core.users(id),
    PRIMARY KEY (user_id, role_id)
);