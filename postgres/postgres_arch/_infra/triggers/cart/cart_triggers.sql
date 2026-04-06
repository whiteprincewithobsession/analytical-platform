CREATE OR REPLACE FUNCTION cart.set_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cart_set_updated
BEFORE UPDATE ON cart.cart
FOR EACH ROW
EXECUTE FUNCTION cart.set_cart_updated_at();