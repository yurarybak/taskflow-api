import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    APP_URL: 'http://localhost:3000',
    FRONTEND_URL: 'http://localhost:3001',
    CORS_ORIGINS: 'http://localhost:3001',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
    JWT_SECRET: 'secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '7d',
    JWT_RESET_PASSWORD_SECRET: 'reset-secret',
    JWT_RESET_PASSWORD_EXPIRES_IN: '30m',
    SENDGRID_API_KEY: 'SG.key',
    SENDGRID_FROM_EMAIL: 'noreply@example.com',
    SENDGRID_FROM_NAME: 'TaskFlow',
    SENDGRID_PASSWORD_RESET_TEMPLATE_ID: 'd-template',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
  };

  it('accepts a complete configuration and converts numeric values', () => {
    const config = validateEnv({ ...validEnv, PORT: '3000' });

    expect(config.REDIS_PORT).toBe(6379);
    expect(config.PORT).toBe(3000);
  });

  it('treats PORT and CORS_ORIGINS as optional', () => {
    const { CORS_ORIGINS: _cors, ...withoutCors } = validEnv;

    expect(() => validateEnv(withoutCors)).not.toThrow();
  });

  it('reports every missing required variable', () => {
    const { JWT_SECRET: _secret, REDIS_HOST: _host, ...incomplete } = validEnv;

    expect(() => validateEnv(incomplete)).toThrow(
      /JWT_SECRET[\s\S]*REDIS_HOST/,
    );
  });

  it('requires both Bull Board credentials or neither', () => {
    expect(() =>
      validateEnv({ ...validEnv, BULL_BOARD_USERNAME: 'admin' }),
    ).toThrow('BULL_BOARD_PASSWORD');
    expect(() =>
      validateEnv({
        ...validEnv,
        BULL_BOARD_USERNAME: 'admin',
        BULL_BOARD_PASSWORD: 'secret',
      }),
    ).not.toThrow();
  });

  it.each([
    ['NODE_ENV', 'staging'],
    ['DATABASE_URL', 'mysql://localhost/db'],
    ['REDIS_PORT', 'not-a-port'],
    ['JWT_REFRESH_EXPIRES_IN', '7 days'],
    ['JWT_EXPIRES_IN', 'soon'],
    ['SENDGRID_FROM_EMAIL', 'not-an-email'],
  ])('rejects an invalid %s', (key, value) => {
    expect(() => validateEnv({ ...validEnv, [key]: value })).toThrow(key);
  });
});
