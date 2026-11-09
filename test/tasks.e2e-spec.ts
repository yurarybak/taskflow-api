import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import {
  createTask,
  createTestApp,
  registerUser,
  TestSession,
  TestTask,
} from './utils/test-app';

interface TaskBody {
  id: string;
  title: string;
  description: string | null;
}

describe('Task description (e2e)', () => {
  let app: INestApplication<App>;
  let session: TestSession;
  let task: TestTask;

  const patchTask = (body: Record<string, unknown>): request.Test =>
    request(app.getHttpServer())
      .patch(`/projects/${task.projectId}/tasks/${task.taskId}`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(body);

  beforeAll(async () => {
    app = await createTestApp();
    session = await registerUser(app);
    task = await createTask(app, session);
  });

  beforeEach(async () => {
    await patchTask({ description: 'Initial description' }).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('clears the description with null', async () => {
    const response = await patchTask({ description: null }).expect(200);

    expect((response.body as TaskBody).description).toBeNull();
  });

  it('clears the description with an empty string', async () => {
    const response = await patchTask({ description: '' }).expect(200);

    expect((response.body as TaskBody).description).toBeNull();
  });

  it('accepts a one-character description', async () => {
    const response = await patchTask({ description: 'x' }).expect(200);

    expect((response.body as TaskBody).description).toBe('x');
  });

  it('keeps the description when the field is omitted', async () => {
    const response = await patchTask({ title: 'Renamed task' }).expect(200);

    expect((response.body as TaskBody).description).toBe('Initial description');
  });

  it('rejects a description longer than 1000 characters', async () => {
    await patchTask({ description: 'a'.repeat(1001) }).expect(400);
  });

  it('stores an empty description on create as null', async () => {
    const response = await request(app.getHttpServer())
      .post(`/projects/${task.projectId}/tasks`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ title: 'Task without description', description: '' })
      .expect(201);

    expect((response.body as TaskBody).description).toBeNull();
  });
});
