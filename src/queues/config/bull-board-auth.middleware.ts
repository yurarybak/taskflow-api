import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';

import type { NextFunction, Request, Response } from 'express';

type Middleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => void;

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

/**
 * Guards the Bull Board dashboard:
 * - credentials configured: HTTP Basic auth is required;
 * - no credentials in production: the dashboard is hidden (404);
 * - no credentials outside production: open for local development.
 */
export function createBullBoardAuthMiddleware(
  configService: ConfigService,
): Middleware {
  const username = configService.get<string>('BULL_BOARD_USERNAME');
  const password = configService.get<string>('BULL_BOARD_PASSWORD');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return (request, response, next) => {
    if (!username || !password) {
      if (isProduction) {
        response.status(404).end();
        return;
      }

      next();
      return;
    }

    const [scheme, encoded] = (request.headers.authorization ?? '').split(' ');
    const decoded = Buffer.from(encoded ?? '', 'base64').toString();
    // Passwords may contain ":", so only the first one separates the username.
    const separatorIndex = decoded.indexOf(':');
    const givenUsername = decoded.slice(0, Math.max(separatorIndex, 0));
    const givenPassword = decoded.slice(separatorIndex + 1);

    if (
      scheme === 'Basic' &&
      separatorIndex !== -1 &&
      safeEqual(givenUsername, username) &&
      safeEqual(givenPassword, password)
    ) {
      next();
      return;
    }

    response.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
    response.status(401).end();
  };
}
