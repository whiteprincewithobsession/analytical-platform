-- Support tickets system
-- Таблица обращений в поддержку

CREATE TABLE IF NOT EXISTS core.support_tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES core.users(id) ON DELETE SET NULL,
    user_email VARCHAR(128) NOT NULL,
    user_name VARCHAR(128),
    subject VARCHAR(256) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status VARCHAR(24) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP,
    resolved_by BIGINT REFERENCES core.users(id),
    admin_reply TEXT,
    category VARCHAR(64) DEFAULT 'general'
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON core.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON core.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON core.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON core.support_tickets(created_at DESC);

COMMENT ON TABLE core.support_tickets IS 'Обращения пользователей в службу поддержки';

-- Таблица сообщений внутри тикета (переписка)
CREATE TABLE IF NOT EXISTS core.ticket_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES core.support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(16) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id BIGINT REFERENCES core.users(id) ON DELETE SET NULL,
    sender_name VARCHAR(128),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON core.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON core.ticket_messages(created_at DESC);

COMMENT ON TABLE core.ticket_messages IS 'Сообщения внутри обращений поддержки (переписка)';

-- Trigger для updated_at
CREATE OR REPLACE FUNCTION core.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_updated_at ON core.support_tickets;
CREATE TRIGGER trg_ticket_updated_at
    BEFORE UPDATE ON core.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION core.update_ticket_timestamp();
