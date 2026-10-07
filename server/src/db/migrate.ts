// db/migrate.ts
// Runner migracji SQL wykonujący pliki z katalogu migrations/ w kolejności leksykograficznej.
// Zawiera: tworzenie tabeli _migrations, iterację po plikach .sql oraz
// jedną transakcję na plik — BEGIN i COMMIT są tu, nie w plikach SQL.
// Pliki SQL nie zawierają BEGIN/COMMIT — runner jest jedyną granicą atomowości.
// Uruchamiany komendą: npm run db:migrate

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        filename   TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file],
      );

      if (rows.length > 0) {
        console.log(`  ✓ ${file} (już wykonana)`);
        continue;
      }

      console.log(`  → Wykonuję ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      // Pojedyncza transakcja na plik — runner zarządza BEGIN/COMMIT,
      // pliki SQL nie zawierają tych instrukcji.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migracja ${file} nie powiodła się: ${err}`);
      }
    }

    console.log('\n✅ Wszystkie migracje wykonane.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('❌ Błąd migracji:', err.message);
  process.exit(1);
});
