import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { createTestApp, registerUser, TestSession } from './utils/test-app';

interface RefreshResponseBody {
  accessToken: string;
  refreshToken: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  const refresh = (refreshToken: string): request.Test =>
    request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken });

  const login = async (session: TestSession): Promise<RefreshResponseBody> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: session.email, password: session.password })
      .expect(200);

    return response.body as RefreshResponseBody;
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user and authorizes requests with the access token', async () => {
    const session = await registerUser(app);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200);
  });

  describe('POST /auth/login', () => {
    it('returns the same 401 for a wrong password and an unknown email', async () => {
      const session = await registerUser(app);

      const wrongPassword = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: session.email, password: 'wrong-password' })
        .expect(401);

      const unknownEmail = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever1' })
        .expect(401);

      expect(wrongPassword.body).toEqual({
        message: 'Invalid credentials',
        error: 'Unauthorized',
        statusCode: 401,
      });
      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });
  });

  describe('POST /auth/register', () => {
    it('returns 409 for an email that is already registered', async () => {
      const session = await registerUser(app);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: session.email, password: 'Password123!' })
        .expect(409);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the token and rejects the used one', async () => {
      const session = await registerUser(app);

      const response = await refresh(session.refreshToken).expect(200);
      const rotated = response.body as RefreshResponseBody;

      expect(rotated.refreshToken).not.toBe(session.refreshToken);
      await refresh(session.refreshToken).expect(401);
    });

    it('revokes the whole session when a rotated token is reused', async () => {
      const session = await registerUser(app);

      const first = (await refresh(session.refreshToken).expect(200))
        .body as RefreshResponseBody;
      const second = (await refresh(first.refreshToken).expect(200))
        .body as RefreshResponseBody;

      await refresh(session.refreshToken).expect(401);
      await refresh(second.refreshToken).expect(401);
    });

    it('keeps other sessions alive when one session is revoked for reuse', async () => {
      const session = await registerUser(app);
      const otherSession = await login(session);

      await refresh(session.refreshToken).expect(200);
      await refresh(session.refreshToken).expect(401);

      await refresh(otherSession.refreshToken).expect(200);
    });

    it('rejects an unknown token', async () => {
      await refresh('not-a-jwt').expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token from the body', async () => {
      const session = await registerUser(app);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ refreshToken: session.refreshToken })
        .expect(200);

      await refresh(session.refreshToken).expect(401);
    });

    it('does not revoke other sessions of the same user', async () => {
      const session = await registerUser(app);
      const otherSession = await login(session);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ refreshToken: session.refreshToken })
        .expect(200);

      await refresh(otherSession.refreshToken).expect(200);
    });
  });

  describe('POST /auth/logout-all', () => {
    it('revokes refresh tokens of every session', async () => {
      const session = await registerUser(app);
      const otherSession = await login(session);

      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);

      await refresh(session.refreshToken).expect(401);
      await refresh(otherSession.refreshToken).expect(401);
    });
  });
});
