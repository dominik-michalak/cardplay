// middleware/errorHandler.ts
// Globalny handler błędów Express oraz klasa AppError.
// Znajduje się tu: AppError (niestandardowy błąd z kodem HTTP i kodem maszynowym)
// oraz funkcja errorHandler montowana jako ostatni middleware w app.ts.
// W trybie development zwraca pełną wiadomość błędu, w production — ogólną.

import { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@cardplay/shared';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiError = { error: { code: err.code, message: err.message } };
    res.status(err.statusCode).json(body);
    return;
  }

  // W produkcji nie ujawniaj szczegółów nieznanych błędów
  const isDev = process.env.NODE_ENV === 'development';
  const body: ApiError = {
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'Wewnętrzny błąd serwera.',
    },
  };

  if (isDev) console.error('[Error]', err);
  res.status(500).json(body);
}
