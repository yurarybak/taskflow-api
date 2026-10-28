import { Logger } from '@nestjs/common';
import { sanitizeLogValue } from '../common/utils/log-sanitize.util';

// Logs an otherwise-unhandled fatal error at error level in the standard format.
// `origin` distinguishes 'uncaughtException' from 'unhandledRejection'.
export function logFatalError(
  logger: Logger,
  error: unknown,
  origin: string,
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(`FATAL ${origin} ${sanitizeLogValue(message)}`, stack);
}

// Monitor fatal errors without overriding Node's default crash behavior.
export function registerFatalErrorLogging(logger: Logger): void {
  process.on('uncaughtExceptionMonitor', (error, origin) => {
    logFatalError(logger, error, origin);
  });
}
