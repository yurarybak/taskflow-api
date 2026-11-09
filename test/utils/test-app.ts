import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

export interface TestSession {
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
}

interface AuthResponseBody {
  accessToken: string;
  refreshToken: string;
  user: { id: string };
}

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>({
    logger: false,
  });
  configureApp(app);

  try {
    await app.init();
  } catch (error) {
    // Without this, open Redis/BullMQ connections keep Jest from exiting.
    await app.close();
    throw error;
  }

  return app;
}

export async function registerUser(
  app: INestApplication<App>,
): Promise<TestSession> {
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'Password123!';

  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
    .expect(201);

  const body = response.body as AuthResponseBody;

  return {
    email,
    password,
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    userId: body.user.id,
  };
}
