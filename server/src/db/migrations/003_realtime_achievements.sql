-- 003_realtime_achievements.sql
-- Tabele funkcji real-time i administracyjnych. Właściciel: Osoba C.
-- Znajdują się tu: matchmaking_queue, achievements, user_achievements,
-- user_settings, notifications, support_tickets, ticket_replies, moderation_actions.
-- Wymaga: 001_core.sql.
-- Nie zawiera BEGIN/COMMIT — transakcją zarządza db/migrate.ts.

-- ─── Tabela: matchmaking_queue ────────────────────────────────────────────────

CREATE TABLE matchmaking_queue (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  game_key    game_key    NOT NULL,
  mode        VARCHAR(20) NOT NULL CHECK (mode IN ('competitive','unrated')),
  elo_at_join SMALLINT    NOT NULL DEFAULT 1000,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mq_game_key ON matchmaking_queue (game_key, mode);

-- ─── Tabela: achievements ─────────────────────────────────────────────────────

CREATE TABLE achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(60) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT        NOT NULL,
  -- NULL = osiągnięcie ogólne (nie per gra)
  game_key    game_key,
  -- Warunek w formacie JSON, np. { "event": "GAME_WON", "count": 10 }
  condition   JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: user_achievements ────────────────────────────────────────────────

CREATE TABLE user_achievements (
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID        NOT NULL REFERENCES achievements(id),
  -- NULL = jeszcze nie odblokowane
  unlocked_at    TIMESTAMPTZ,
  -- 0–100
  progress       SMALLINT    NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_ua_user_id ON user_achievements (user_id);

-- ─── Tabela: user_settings ────────────────────────────────────────────────────

CREATE TABLE user_settings (
  user_id       UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme         VARCHAR(10) NOT NULL DEFAULT 'dark' CHECK (theme IN ('light','dark','system')),
  sound_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
  sound_volume  SMALLINT    NOT NULL DEFAULT 80 CHECK (sound_volume BETWEEN 0 AND 100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: notifications ───────────────────────────────────────────────────

CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(40) NOT NULL,
  message    TEXT        NOT NULL,
  data       JSONB,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications (user_id) WHERE is_read = FALSE;

-- ─── Tabela: support_tickets ─────────────────────────────────────────────────

CREATE TYPE ticket_status AS ENUM ('open', 'in_review', 'resolved', 'closed');

CREATE TABLE support_tickets (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          NOT NULL REFERENCES users(id),
  subject    VARCHAR(120)  NOT NULL,
  body       TEXT          NOT NULL CHECK (length(body) <= 2000),
  status     ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user_id ON support_tickets (user_id);
CREATE INDEX idx_tickets_status  ON support_tickets (status, created_at DESC);

-- ─── Tabela: ticket_replies ───────────────────────────────────────────────────

CREATE TABLE ticket_replies (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES users(id),
  message    TEXT        NOT NULL CHECK (length(message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tr_ticket_id ON ticket_replies (ticket_id);

-- ─── Tabela: moderation_actions ──────────────────────────────────────────────

CREATE TABLE moderation_actions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id   UUID        NOT NULL REFERENCES users(id),
  target_user_id UUID        NOT NULL REFERENCES users(id),
  -- 'ban', 'unban', 'suspend', 'warn'
  type           VARCHAR(20) NOT NULL,
  reason         TEXT,
  -- NULL = permanentne (dla ban); timestamp = ban tymczasowy
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_target ON moderation_actions (target_user_id, created_at DESC);

-- ─── Trigger: updated_at na support_tickets ───────────────────────────────────

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
