import { ConfigService } from '@nestjs/config';
import { createBullBoardAuthMiddleware } from './bull-board-auth.middleware';

import type { NextFunction, Request, Response } from 'express';

describe('createBullBoardAuthMiddleware', () => {
  const makeConfig = (env: Record<string, string>): ConfigService =>
    ({ get: (key: string) => env[key] }) as unknown as ConfigService;

  const run = (
    env: Record<string, string>,
    authorization?: string,
  ): { next: jest.Mock; status: jest.Mock; setHeader: jest.Mock } => {
    const next = jest.fn();
    const end = jest.fn();
    const status = jest.fn().mockReturnValue({ end });
    const setHeader = jest.fn();
    const request = { headers: { authorization } } as unknown as Request;
    const response = { status, setHeader } as unknown as Response;

    createBullBoardAuthMiddleware(makeConfig(env))(
      request,
      response,
      next as NextFunction,
    );

    return { next, status, setHeader };
  };

  const basic = (credentials: string): string =>
    `Basic ${Buffer.from(credentials).toString('base64')}`;
  const credentials = {
    BULL_BOARD_USERNAME: 'admin',
    BULL_BOARD_PASSWORD: 's3cret',
  };

  it('stays open in development when no credentials are configured', () => {
    expect(run({}).next).toHaveBeenCalled();
  });

  it('hides the dashboard in production without credentials', () => {
    const { next, status } = run({ NODE_ENV: 'production' });

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(404);
  });

  it('accepts valid basic auth credentials', () => {
    expect(run(credentials, basic('admin:s3cret')).next).toHaveBeenCalled();
  });

  it('supports passwords that contain a colon', () => {
    const env = { ...credentials, BULL_BOARD_PASSWORD: 'pa:ss:word' };

    expect(run(env, basic('admin:pa:ss:word')).next).toHaveBeenCalled();
  });

  it.each([
    ['missing header', undefined],
    ['wrong password', basic('admin:wrong')],
    ['wrong scheme', 'Bearer token'],
  ])('rejects %s with 401', (_case, authorization) => {
    const { next, status, setHeader } = run(credentials, authorization);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Basic realm="Bull Board"',
    );
  });
});
