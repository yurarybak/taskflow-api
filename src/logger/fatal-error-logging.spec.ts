import { Logger } from '@nestjs/common';
import { logFatalError } from './fatal-error-logging';

describe('logFatalError', () => {
  const makeLogger = (): { logger: Logger; error: jest.SpyInstance } => {
    const logger = new Logger('Process');
    const error = jest.spyOn(logger, 'error').mockImplementation();
    return { logger, error };
  };

  it('logs an Error with its origin, message and stack at error level', () => {
    const { logger, error } = makeLogger();
    const err = new Error('boom');

    logFatalError(logger, err, 'uncaughtException');

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('FATAL uncaughtException boom'),
      err.stack,
    );
  });

  it('handles a non-Error rejection reason and tags the origin', () => {
    const { logger, error } = makeLogger();

    logFatalError(logger, 'just a string', 'unhandledRejection');

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('FATAL unhandledRejection just a string'),
      undefined,
    );
  });

  it('sanitizes control characters out of the message', () => {
    const { logger, error } = makeLogger();

    logFatalError(logger, new Error('bad\r\nINJECTED'), 'uncaughtException');

    // The stripped message keeps `badINJECTED` contiguous; an unsanitized one
    // would still have the injected CR/LF between the words.
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('FATAL uncaughtException badINJECTED'),
      expect.any(String),
    );
  });
});
