// config/db.ts
// Singleton Pool połączeń z PostgreSQL.
// Znajduje się tu: instancja db (pg.Pool) używana przez wszystkie moduły
// oraz funkcja checkDbConnection() sprawdzająca połączenie przy starcie serwera.

import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('Brak zmiennej środowiskowej DATABASE_URL');
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on('error', (err) => {
  console.error('[DB] Nieoczekiwany błąd klienta:', err.message);
});

/** Testuje połączenie z bazą — używane przy starcie serwera. */
export async function checkDbConnection(): Promise<void> {
  const client = await db.connect();
  await client.query('SELECT 1');
  client.release();
  console.log('[DB] Połączono z PostgreSQL ✓');
}
