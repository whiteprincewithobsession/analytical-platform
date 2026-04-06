CREATE TABLE sales.delivery_types (
    code         varchar(32) PRIMARY KEY,
    name         varchar(100) NOT NULL,
    description  text,
    active       boolean NOT NULL DEFAULT true
);
