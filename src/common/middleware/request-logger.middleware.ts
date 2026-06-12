import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const { method, originalUrl } = request;
    const startedAt = Date.now();

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const { statusCode } = response;
      const message = `${method} ${originalUrl} ${statusCode} ${durationMs}ms`;

      if (statusCode >= 500) {
        this.logger.error(message);
        return;
      }

      if (statusCode >= 400) {
        this.logger.warn(message);
        return;
      }

      this.logger.log(message);
    });

    next();
  }
}
