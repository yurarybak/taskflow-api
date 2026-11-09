import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { createTestApp, registerUser, TestSession } from './utils/test-app';

const PUBLIC_USER_KEYS = [
  'createdAt',
  'email',
  'firstName',
  'id',
  'lastName',
  'updatedAt',
];

// 1×1 transparent PNG
const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

interface AuthResponseBody {
  refreshToken: string;
  user: Record<string, unknown>;
}

describe('Public user responses (e2e)', () => {
  let app: INestApplication<App>;
  let session: TestSession;

  const expectPublicUser = (body: unknown): void => {
    expect(Object.keys(body as object).sort()).toEqual(PUBLIC_USER_KEYS);
  };

  beforeAll(async () => {
    app = await createTestApp();
    session = await registerUser(app);

    // With an avatar uploaded, avatarStorageName is set and would show up if leaked.
    await request(app.getHttpServer())
      .post('/users/me/avatar')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .attach('file', PNG_PIXEL, {
        filename: 'pixel.png',
        contentType: 'image/png',
      })
      .expect(200);
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .delete('/users/me/avatar')
      .set('Authorization', `Bearer ${session.accessToken}`);
    await app.close();
  });

  it('GET /users/me returns only public fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200);

    expectPublicUser(response.body);
  });

  it('PATCH /users/me returns only public fields', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ firstName: 'Ann', lastName: 'Lee' })
      .expect(200);

    expectPublicUser(response.body);
    expect(response.body).toMatchObject({ firstName: 'Ann', lastName: 'Lee' });
  });

  it('GET /auth/me returns the same public user as /users/me', async () => {
    const [authMe, usersMe] = await Promise.all([
      request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200),
      request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200),
    ]);

    expectPublicUser(authMe.body);
    expect(authMe.body).toEqual(usersMe.body);
  });

  it('login and refresh return only public user fields', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: session.email, password: session.password })
      .expect(200);
    const loginBody = login.body as AuthResponseBody;

    expectPublicUser(loginBody.user);

    const refresh = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(200);

    expectPublicUser((refresh.body as AuthResponseBody).user);
  });
});
