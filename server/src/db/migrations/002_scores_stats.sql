-- 002_scores_stats.sql
-- Tabele wyników, statystyk, Elo i rankingów. Właściciel: Osoba B.
-- Znajdują się tu: game_record_players, user_game_stats, leaderboard_snapshots.
-- Wymaga: 001_core.sql.
-- Nie zawiera BEGIN/COMMIT — transakcją zarządza db/migrate.ts.

-- ─── Tabela: game_record_players ──────────────────────────────────────────────
--
-- Wynik konkretnego gracza w konkretnym meczu.
-- Zapisywany przez moduł B po otrzymaniu game:finished.

CREATE TABLE game_record_players (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_record_id  UUID        NOT NULL REFERENCES game_records(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id),
  final_rank      SMALLINT    NOT NULL CHECK (final_rank >= 1),
  -- Numeryczny wynik do Elo: 1 = wygrana, 0.5 = remis, 0 = przegrana
  elo_score       NUMERIC(4,2) NOT NULL CHECK (elo_score BETWEEN 0 AND 1),
  elo_before      SMALLINT    NOT NULL,
  elo_after       SMALLINT    NOT NULL,
  elo_delta       SMALLINT    NOT NULL,
  -- Dane specyficzne dla gry (rounds_won, chips_end itp.)
  metadata        JSONB,
  UNIQUE (game_record_id, user_id)
);

CREATE INDEX idx_grp_game_record_id ON game_record_players (game_record_id);
CREATE INDEX idx_grp_user_id        ON game_record_players (user_id);

-- ─── Tabela: user_game_stats ──────────────────────────────────────────────────
--
-- Zagregowane statystyki gracza per typ gry.
-- Aktualizowane po każdym meczu przez moduł B (upsert).

CREATE TABLE user_game_stats (
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_key      game_key    NOT NULL,
  games_played  INT         NOT NULL DEFAULT 0,
  games_won     INT         NOT NULL DEFAULT 0,
  total_score   BIGINT      NOT NULL DEFAULT 0,
  best_score    INT         NOT NULL DEFAULT 0,
  -- Elo startowe 1000 dla każdej gry
  elo           SMALLINT    NOT NULL DEFAULT 1000,
  -- Liczba gier do granicy rankingowej (pierwsze 30 = tryb prowizoryczny K=40)
  games_ranked  INT         NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, game_key)
);

CREATE INDEX idx_ugs_game_key_elo ON user_game_stats (game_key, elo DESC);

-- ─── Tabela: leaderboard_snapshots ───────────────────────────────────────────
--
-- Tygodniowe snapshoty rankingu generowane przez cron / endpoint admina.

CREATE TABLE leaderboard_snapshots (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key     game_key    NOT NULL,
  -- 'all_time' lub rok-tydzień ISO, np. '2026-W22'
  period       VARCHAR(20) NOT NULL,
  user_id      UUID        NOT NULL REFERENCES users(id),
  rank         INT         NOT NULL,
  elo          SMALLINT    NOT NULL,
  games_played INT         NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ls_game_period     ON leaderboard_snapshots (game_key, period);
CREATE INDEX idx_ls_game_period_rank ON leaderboard_snapshots (game_key, period, rank);
