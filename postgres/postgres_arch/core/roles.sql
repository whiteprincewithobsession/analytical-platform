CREATE TABLE core.roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(40) NOT NULL UNIQUE,    -- customer / admin / manager / support
    description TEXT
);
