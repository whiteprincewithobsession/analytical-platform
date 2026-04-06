CREATE OR REPLACE FUNCTION cart.set_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cart_items_set_updated
BEFORE UPDATE ON cart.cart_items
FOR EACH ROW
EXECUTE FUNCTION cart.set_cart_items_updated_at();