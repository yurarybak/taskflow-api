import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { createTestApp, registerUser } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

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
});
