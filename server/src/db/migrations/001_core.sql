-- 001_core.sql
-- Tabele rdzeniowe platformy. Właściciel: Osoba A.
-- Zawiera: enumy (user_role, game_key, game_mode, room_status),
-- tabele users, refresh_tokens, game_rooms, room_players, game_records,
-- funkcję walidującą max_players względem typu gry oraz trigger updated_at.
-- Wszystkie pozostałe migracje zależą od tych tabel.
-- Nie zawiera BEGIN/COMMIT — transakcją zarządza db/migrate.ts.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role   AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE game_key    AS ENUM ('war', 'macao', 'texas_clinch', 'poker');
CREATE TYPE game_mode   AS ENUM ('competitive', 'unrated', 'private');
CREATE TYPE room_status AS ENUM ('waiting', 'in_progress', 'finished', 'archived');

-- ─── Tabela: users ────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          user_role    NOT NULL DEFAULT 'user',
  is_banned     BOOLEAN      NOT NULL DEFAULT FALSE,
  ban_reason    TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username  ON users (username);
CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_is_banned ON users (is_banned) WHERE is_banned = TRUE;

-- ─── Tabela: refresh_tokens ───────────────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- ─── Funkcja: walidacja max_players względem game_key ─────────────────────────
-- War i Texas Clinch to gry 1v1 — max 2 graczy.
-- Macao: 2–4. Poker: 2–6.
-- Walidacja w bazie zapobiega niespójności gdy serwis pominie sprawdzenie.

-- Decyzja produktowa: texas_clinch = 1v1 (max 2 graczy).
-- Zmiana wymaga PR kontraktowego aktualizującego shared/src/room.ts i smoke.test.ts.
CREATE OR REPLACE FUNCTION check_max_players_for_game(gk game_key, mp SMALLINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN CASE gk
    WHEN 'war'          THEN mp = 2
    WHEN 'texas_clinch' THEN mp = 2
    WHEN 'macao'        THEN mp BETWEEN 2 AND 4
    WHEN 'poker'        THEN mp BETWEEN 2 AND 6
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─── Tabela: game_rooms ───────────────────────────────────────────────────────

CREATE TABLE game_rooms (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key     game_key    NOT NULL,
  mode         game_mode   NOT NULL DEFAULT 'unrated',
  status       room_status NOT NULL DEFAULT 'waiting',
  max_players  SMALLINT    NOT NULL,
  host_user_id UUID        NOT NULL REFERENCES users(id),
  invite_code  CHAR(6)     UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  -- Wymusza spójność między typem gry a liczbą miejsc na poziomie bazy.
  CONSTRAINT chk_max_players_for_game
    CHECK (check_max_players_for_game(game_key, max_players))
);

CREATE INDEX idx_game_rooms_status   ON game_rooms (status);
CREATE INDEX idx_game_rooms_game_key ON game_rooms (game_key);
CREATE INDEX idx_game_rooms_invite   ON game_rooms (invite_code) WHERE invite_code IS NOT NULL;

-- ─── Tabela: room_players ─────────────────────────────────────────────────────

CREATE TABLE room_players (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id),
  seat_index  SMALLINT    NOT NULL CHECK (seat_index BETWEEN 0 AND 5),
  elo_at_join SMALLINT    NOT NULL DEFAULT 1000,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at     TIMESTAMPTZ,
  UNIQUE (room_id, user_id),
  UNIQUE (room_id, seat_index)
);

CREATE INDEX idx_room_players_room_id ON room_players (room_id);
CREATE INDEX idx_room_players_user_id ON room_players (user_id);

-- ─── Tabela: game_records ─────────────────────────────────────────────────────
-- UNIQUE (room_id) gwarantuje jeden rekord gry na pokój.
-- Zapis wyniku i Elo musi odbywać się w jednej transakcji z SELECT FOR UPDATE.

CREATE TABLE game_records (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID        NOT NULL UNIQUE REFERENCES game_rooms(id),
  game_key      game_key    NOT NULL,
  mode          game_mode   NOT NULL,
  state         JSONB,
  result        JSONB,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ,
  finish_reason VARCHAR(20) CHECK (
    finish_reason IN ('normal', 'disconnect', 'early_finish', 'walkover')
  )
);

CREATE INDEX idx_game_records_game_key ON game_records (game_key);

-- ─── Trigger: auto-update updated_at na users ─────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
