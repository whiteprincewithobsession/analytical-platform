CREATE TABLE feedback.reviews (
    id serial PRIMARY KEY,
    user_id int NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    product_id int NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE SET NULL,
    order_item_id int,
    rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title varchar(256),
    content text NOT NULL,
    verified_purchase boolean NOT NULL DEFAULT false,
    helpful_count int NOT NULL DEFAULT 0,
    unhelpful_count  int NOT NULL DEFAULT 0,
    moderation_status varchar(32) NOT NULL DEFAULT 'pending',
    moderated_by int REFERENCES core.users(id) ON DELETE SET NULL,
    moderated_at timestamptz,
    moderation_notes text,
    visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

