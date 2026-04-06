CREATE TABLE sales.currencies (
    code varchar(8) PRIMARY KEY,
    name varchar(64) NOT NULL,
    symbol varchar(8),
    scale smallint NOT NULL DEFAULT 2,
    countries varchar(128),
    active boolean NOT NULL DEFAULT true
);



