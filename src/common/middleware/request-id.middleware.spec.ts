import { Request, Response } from 'express';
import {
  REQUEST_ID_HEADER,
  RequestIdMiddleware,
} from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware();

  const invoke = (
    headers: Record<string, string> = {},
  ): { req: Request; setHeader: jest.Mock; next: jest.Mock } => {
    const req = { headers } as unknown as Request;
    const setHeader = jest.fn();
    const next = jest.fn();

    middleware.use(req, { setHeader } as unknown as Response, next);

    return { req, setHeader, next };
  };

  it('generates a UUID and echoes it in the response header', () => {
    const { req, setHeader, next } = invoke();

    expect(req.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, req.id);
    expect(next).toHaveBeenCalled();
  });

  it('reuses an incoming X-Request-Id', () => {
    expect(invoke({ [REQUEST_ID_HEADER]: 'trace-42' }).req.id).toBe('trace-42');
  });

  it('strips control characters and caps the length of the incoming id', () => {
    const crlf = String.fromCharCode(13, 10);
    const { req } = invoke({
      [REQUEST_ID_HEADER]: `abc${crlf}FAKE${'x'.repeat(200)}`,
    });

    expect(req.id.startsWith('abcFAKE')).toBe(true);
    expect(req.id).toHaveLength(128);
  });

  it('generates a new id when the incoming one is empty after sanitizing', () => {
    const { req } = invoke({ [REQUEST_ID_HEADER]: String.fromCharCode(10) });

    expect(req.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
