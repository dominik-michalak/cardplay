// config/env.ts
// Walidacja zmiennych środowiskowych przy starcie serwera.
// Zawiera schemat Zod dla wszystkich wymaganych zmiennych oraz
// wyeksportowany obiekt env z typami. Proces kończy się błędem
// jeśli brakuje zmiennej lub wartość nie spełnia wymagań (np. zbyt krótki sekret JWT).

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),

  DATABASE_URL: z.string().url('DATABASE_URL musi być poprawnym URL postgres://...'),

  JWT_SECRET: z
    .string()
    .min(64, 'JWT_SECRET musi mieć co najmniej 64 znaki'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(64, 'JWT_REFRESH_SECRET musi mieć co najmniej 64 znaki'),

  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CLIENT_ORIGIN: z.string().url('CLIENT_ORIGIN musi być poprawnym URL').default('http://localhost:5173'),

  ALLOW_TEST_SEED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Błąd konfiguracji — nieprawidłowe zmienne środowiskowe:\n');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nSkopiuj .env.example jako .env i uzupełnij brakujące wartości.\n');
  process.exit(1);
}

export const env = parsed.data;
