import { randomUUID } from 'crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { sanitizeLogValue } from '../utils/log-sanitize.util';

export const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Assigns `req.id` for log correlation: reuses an incoming X-Request-Id (sanitized
 * and length-capped, since it is client-controlled) or generates a UUID, and echoes
 * it back in the response header.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const candidate = sanitizeLogValue(
      (Array.isArray(incoming) ? incoming[0] : incoming) ?? '',
    )
      .trim()
      .slice(0, MAX_REQUEST_ID_LENGTH);

    req.id = candidate || randomUUID();
    res.setHeader(REQUEST_ID_HEADER, req.id);

    next();
  }
}
