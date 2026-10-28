import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingMiddleware } from './logging.middleware';

interface InvokeOptions {
  statusCode?: number;
  user?: { email: string };
  contentLength?: number;
  headers?: Record<string, string>;
  ip?: string;
}

describe('LoggingMiddleware', () => {
  const middleware = new LoggingMiddleware();
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const invoke = (options: InvokeOptions): void => {
    let finish: () => void = () => undefined;
    const req = {
      method: 'GET',
      originalUrl: '/test?ids=1',
      id: 'cid-1',
      ip: options.ip ?? '10.0.0.1',
      user: options.user,
      headers: options.headers ?? {},
      socket: { remoteAddress: '10.0.0.1' },
    } as unknown as Request;
    const res = {
      statusCode: options.statusCode ?? 200,
      on: (event: string, cb: () => void) => {
        if (event === 'finish') finish = cb;
      },
      getHeader: () => options.contentLength,
    } as unknown as Response;

    middleware.use(req, res, jest.fn());
    finish();
  };

  it('logs the RESPONSE line with the user, request target, status and size', () => {
    invoke({ statusCode: 200, user: { email: 'a@b.com' }, contentLength: 512 });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[cid-1] RESPONSE 10\.0\.0\.1 a@b\.com "GET \/test\?ids=1" 200 512 rt=\d+ms$/,
      ),
    );
  });

  it('logs the client IP from Incap-Client-IP behind the WAF', () => {
    invoke({
      user: { email: 'a@b.com' },
      headers: { 'incap-client-ip': '185.42.130.93' },
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('RESPONSE 185.42.130.93 a@b.com'),
    );
  });

  it('falls back to the left-most X-Forwarded-For entry with the port stripped', () => {
    invoke({ headers: { 'x-forwarded-for': '203.0.113.9:16108, 10.0.0.1' } });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('RESPONSE 203.0.113.9 -'),
    );
  });

  it('normalizes an IPv4-mapped IPv6 address', () => {
    invoke({ ip: '::ffff:169.254.131.1' });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('RESPONSE 169.254.131.1 -'),
    );
  });

  it('uses "-" for the user on a public / unauthenticated request', () => {
    invoke({ statusCode: 200 });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/ RESPONSE 10\.0\.0\.1 - "GET /),
    );
  });

  it('uses "-" for the size when Content-Length is absent', () => {
    invoke({ statusCode: 200, user: { email: 'a@b.com' } });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/ 200 - rt=\d+ms$/),
    );
  });

  it('logs 4xx as a warning', () => {
    invoke({ statusCode: 404 });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/ 404 /));
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs 5xx as an error', () => {
    invoke({ statusCode: 500 });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/ 500 /), '');
  });
});
