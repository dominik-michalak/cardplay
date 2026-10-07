// app.ts
// Fabryka aplikacji Express zwracająca skonfigurowaną instancję app.
// Znajduje się tu: middleware (helmet, cors, rate limit, json parser),
// health check GET /health oraz miejsca montowania routerów każdej osoby.
// Nie nasłuchuje na porcie — robi to server.ts.

import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. CORS
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }),
  );

  // 3. JSON body parser (max 50kb)
  app.use(express.json({ limit: '50kb' }));

  // 4. Auth rate limit (10 req / 15 min per IP)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      error: { code: 'TOO_MANY_REQUESTS', message: 'Zbyt wiele prób. Spróbuj za 15 minut.' },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/v1/auth', authLimiter);

  // 5. General API rate limit (200 req / min per IP)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  // 6. Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── Routy API ────────────────────────────────────────────────────────────
  // Właściciel A:
  // import { authRouter }  from './modules/auth/auth.router';
  // import { usersRouter } from './modules/users/users.router';
  // import { gamesRouter } from './modules/lobby/games.router';
  // import { roomsRouter } from './modules/lobby/rooms.router';
  // app.use('/api/v1/auth',  authRouter);
  // app.use('/api/v1/users', usersRouter);
  // app.use('/api/v1/games', gamesRouter);
  // app.use('/api/v1/rooms', roomsRouter);

  // Właściciel B:
  // import { scoresRouter }      from './modules/scores/scores.router';
  // import { leaderboardRouter } from './modules/leaderboard/leaderboard.router';
  // import { profileRouter }     from './modules/profile/profile.router';
  // app.use('/api/v1/scores',      scoresRouter);
  // app.use('/api/v1/leaderboard', leaderboardRouter);
  // app.use('/api/v1/profile',     profileRouter);

  // Właściciel C:
  // import { matchmakingRouter }  from './modules/matchmaking/matchmaking.router';
  // import { lobbiesRouter }      from './modules/rooms/lobbies.router';
  // import { achievementsRouter } from './modules/achievements/achievements.router';
  // import { ticketsRouter }      from './modules/tickets/tickets.router';
  // import { settingsRouter }     from './modules/settings/settings.router';
  // app.use('/api/v1/matchmaking',  matchmakingRouter);
  // app.use('/api/v1/lobbies',      lobbiesRouter);
  // app.use('/api/v1/achievements', achievementsRouter);
  // app.use('/api/v1/tickets',      ticketsRouter);
  // app.use('/api/v1/settings',     settingsRouter);

  // Global error handler — musi być ostatni
  app.use(errorHandler);

  return app;
}
