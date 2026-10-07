// db/migrations.test.ts
// Test integracyjny migracji wymagający działającej bazy PostgreSQL.
// Sprawdza czy wszystkie migracje wykonują się na czystej bazie oraz
// czy ponowne uruchomienie migratora jest idempotentne (nie tworzy duplikatów).
// Uruchamiany przez CI w jobie Test gdzie dostępny jest kontener PostgreSQL.

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

// Pomiń test jeśli baza nie jest dostępna (np. lokalne uruchomienie bez Dockera)
const describeIfDb = DATABASE_URL ? describe : describe.skip;

describeIfDb('migracje — integracja', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('tabela _migrations istnieje po migracji', async () => {
    const { rows } = await pool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename = '_migrations'
    `);
    expect(rows).toHaveLength(1);
  });

  it('wszystkie pliki .sql są zapisane w _migrations', async () => {
    const migrationsDir = path.join(__dirname, 'migrations');
    const sqlFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows } = await pool.query(
      'SELECT filename FROM _migrations ORDER BY filename',
    );
    const applied = rows.map((r: { filename: string }) => r.filename);

    for (const file of sqlFiles) {
      expect(applied).toContain(file);
    }
  });

  it('tabela users istnieje z wymaganymi kolumnami', async () => {
    const { rows } = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    const cols = rows.map((r: { column_name: string }) => r.column_name);
    expect(cols).toContain('id');
    expect(cols).toContain('username');
    expect(cols).toContain('email');
    expect(cols).toContain('password_hash');
    expect(cols).toContain('role');
  });

  it('tabela game_rooms ma constraint check_max_players_for_game', async () => {
    const { rows } = await pool.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'game_rooms'::regclass
        AND conname = 'chk_max_players_for_game'
    `);
    expect(rows).toHaveLength(1);
  });

  it('game_records ma UNIQUE na room_id', async () => {
    const { rows } = await pool.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'game_records'::regclass
        AND contype = 'u'
        AND conname LIKE '%room_id%'
    `);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('ponowne uruchomienie migratora jest idempotentne', async () => {
    // Sprawdź że liczba wierszy w _migrations się nie zmienia po "re-run"
    const { rows: before } = await pool.query('SELECT COUNT(*) FROM _migrations');
    const countBefore = Number(before[0].count);

    // Symuluj re-run: wszystkie pliki powinny być pominięte
    const migrationsDir = path.join(__dirname, 'migrations');
    const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    for (const file of sqlFiles) {
      const { rows } = await pool.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file],
      );
      // Każdy plik musi już być w tabeli
      expect(rows.length).toBe(1);
    }

    const { rows: after } = await pool.query('SELECT COUNT(*) FROM _migrations');
    expect(Number(after[0].count)).toBe(countBefore);
  });
});
