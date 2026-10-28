import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { resolveClientIp } from '../utils/client-ip.util';
import { sanitizeLogValue } from '../utils/log-sanitize.util';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, id } = req;
    const start = Date.now();
    const client = sanitizeLogValue(resolveClientIp(req));

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      // Sanitize request-derived values (user, target) so they cannot inject or
      // split log lines; the id is sanitized upstream and the client ip above.
      const user = sanitizeLogValue(req.user?.email ?? '-');
      const target = sanitizeLogValue(`${method} ${originalUrl}`);
      const bytes = String(res.getHeader('content-length') ?? '-');
      const message = `[${id}] RESPONSE ${client} ${user} "${target}" ${statusCode} ${bytes} rt=${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(message, '');
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
