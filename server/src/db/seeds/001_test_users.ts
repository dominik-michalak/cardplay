// db/seeds/001_test_users.ts
// Seed tworzący konta testowe: admin, moderator i 5 użytkowników.
// Zawiera: guard blokujący uruchomienie poza NODE_ENV=development/test
// oraz wymóg jawnego ALLOW_TEST_SEED=true — zabezpieczenie przed
// przypadkowym utworzeniem kont admina na środowisku produkcyjnym.
// Hasło wszystkich kont: Test1234!
// Uruchamiany komendą: npm run db:seed

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// ─── Guard: blokada na produkcji ──────────────────────────────────────────────
const nodeEnv = process.env.NODE_ENV ?? 'development';
const allowSeed = process.env.ALLOW_TEST_SEED === 'true';

if (!['development', 'test'].includes(nodeEnv)) {
  console.error('❌ Seed jest dozwolony tylko na NODE_ENV=development lub test.');
  process.exit(1);
}

if (!allowSeed) {
  console.error('❌ Ustaw ALLOW_TEST_SEED=true w .env żeby uruchomić seed.');
  console.error('   Nigdy nie ustawiaj tej zmiennej na środowisku produkcyjnym.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TEST_PASSWORD = 'Test1234!';
const BCRYPT_ROUNDS = 12;

const TEST_USERS = [
  { username: 'admin',     email: 'admin@cardplay.local',     role: 'admin'     },
  { username: 'moderator', email: 'moderator@cardplay.local', role: 'moderator' },
  { username: 'alice',     email: 'alice@cardplay.local',     role: 'user'      },
  { username: 'bob',       email: 'bob@cardplay.local',       role: 'user'      },
  { username: 'charlie',   email: 'charlie@cardplay.local',   role: 'user'      },
  { username: 'diana',     email: 'diana@cardplay.local',     role: 'user'      },
  { username: 'eve',       email: 'eve@cardplay.local',       role: 'user'      },
];

async function seed() {
  const client = await pool.connect();
  const hash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);

  try {
    console.log('🌱 Seed: użytkownicy testowi (NODE_ENV=' + nodeEnv + ')');

    for (const u of TEST_USERS) {
      await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [u.username, u.email, hash, u.role],
      );
      console.log(`  ✓ ${u.username} (${u.role})`);
    }

    console.log('\n✅ Seed zakończony. Hasło dla wszystkich: Test1234!');
    console.log('   ⚠️  Te konta są wyłącznie do celów deweloperskich.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Błąd seeda:', err.message);
  process.exit(1);
});
