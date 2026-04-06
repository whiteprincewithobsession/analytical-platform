CREATE TABLE catalog.warehouse_details (
  warehouse_id int PRIMARY KEY REFERENCES catalog.warehouses(id) ON DELETE CASCADE,
  capacity int,
  temperature_controlled boolean DEFAULT false,
  operating_hours varchar(256),
  manager_name varchar(128),
  manager_phone varchar(32),
  notes text
);