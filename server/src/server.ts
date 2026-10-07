// server.ts
// Punkt startowy serwera Node.js.
// Zawiera funkcję bootstrap łączącą walidację konfiguracji, bazę danych,
// aplikację Express i serwer Socket.IO w jeden proces nasłuchujący na PORT z .env.

import 'dotenv/config';
import { env } from './config/env';
import http from 'http';
import { createApp } from './app';
import { createSocketServer } from './socket/index';
import { checkDbConnection } from './config/db';

async function bootstrap() {
  await checkDbConnection();

  const app = createApp();
  const httpServer = http.createServer(app);
  const { cleanup } = createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] CardPlay uruchomiony na porcie ${env.PORT} ✓`);
    console.log(`[Server] Środowisko: ${env.NODE_ENV}`);
  });

  // Czyszczenie zasobów przy zamknięciu procesu
  const shutdown = () => {
    console.log('[Server] Zamykanie...');
    cleanup();
    httpServer.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Server] Błąd startu:', err.message);
  process.exit(1);
});
