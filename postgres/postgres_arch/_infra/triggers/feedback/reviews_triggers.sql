CREATE OR REPLACE FUNCTION feedback.set_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_set_updated
BEFORE UPDATE ON feedback.reviews
FOR EACH ROW
EXECUTE FUNCTION feedback.set_review_updated_at();