CREATE OR REPLACE FUNCTION catalog.set_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_set_updated
BEFORE UPDATE ON catalog.products
FOR EACH ROW
EXECUTE FUNCTION catalog.set_product_updated_at();
