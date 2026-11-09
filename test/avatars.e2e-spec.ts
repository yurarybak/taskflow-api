import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { createTestApp, registerUser, TestSession } from './utils/test-app';

// 1×1 transparent PNG
const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('Avatars (e2e)', () => {
  let app: INestApplication<App>;
  let session: TestSession;

  const uploadAvatar = (
    filename: string,
    contentType: string,
    content: Buffer,
  ): request.Test =>
    request(app.getHttpServer())
      .post('/users/me/avatar')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .attach('file', content, { filename, contentType });

  beforeAll(async () => {
    app = await createTestApp();
    session = await registerUser(app);
  });

  afterEach(async () => {
    await request(app.getHttpServer())
      .delete('/users/me/avatar')
      .set('Authorization', `Bearer ${session.accessToken}`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves an uploaded avatar embeddable from another origin', async () => {
    await uploadAvatar('pixel.png', 'image/png', PNG_PIXEL).expect(200);

    const response = await request(app.getHttpServer())
      .get(`/users/${session.userId}/avatar`)
      .expect(200);

    expect(response.headers['cross-origin-resource-policy']).toBe(
      'cross-origin',
    );
    expect(response.headers['content-type']).toBe('image/png');
  });

  it('keeps same-origin resource policy on other routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200);

    expect(response.headers['cross-origin-resource-policy']).toBe(
      'same-origin',
    );
  });

  it('returns 404 for a user without an avatar', async () => {
    await request(app.getHttpServer())
      .get(`/users/${session.userId}/avatar`)
      .expect(404);
  });

  it('rejects a non-image upload with 400', async () => {
    const response = await uploadAvatar(
      'notes.txt',
      'text/plain',
      Buffer.from('hello'),
    ).expect(400);

    expect(response.body).toMatchObject({
      message: 'Only jpeg, png and webp images are allowed',
    });
  });

  it('never serves an upload with the Content-Type of its file name', async () => {
    await uploadAvatar(
      'evil.html',
      'image/png',
      Buffer.from('<script>alert(1)</script>'),
    ).expect(200);

    const response = await request(app.getHttpServer())
      .get(`/users/${session.userId}/avatar`)
      .expect(200);

    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
