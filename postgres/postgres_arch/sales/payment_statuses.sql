CREATE TABLE sales.payment_statuses (
    code        varchar(32) PRIMARY KEY,
    name        varchar(100) NOT NULL,
    description text
);