import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import {
  createTask,
  createTestApp,
  registerUser,
  TestSession,
} from './utils/test-app';

const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
const WEB_ORIGIN = 'http://localhost:5173';

const ALLOWED_FILES: [string, string, Buffer][] = [
  ['report.pdf', 'application/pdf', Buffer.from('%PDF-1.7\n%%EOF\n')],
  [
    'pixel.png',
    'image/png',
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    ),
  ],
  ['photo.jpg', 'image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00])],
  [
    'image.webp',
    'image/webp',
    Buffer.from('RIFF\x10\x00\x00\x00WEBPVP8 ', 'latin1'),
  ],
  ['notes.txt', 'text/plain', Buffer.from('plain text')],
  ['archive.zip', 'application/zip', ZIP],
  [
    'doc.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ZIP,
  ],
  [
    'sheet.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ZIP,
  ],
];

interface AttachmentBody {
  id: string;
  originalName: string;
  mimeType: string;
}

describe('Task attachments (e2e)', () => {
  let app: INestApplication<App>;
  let session: TestSession;
  let taskId: string;
  const uploadedIds: string[] = [];

  const upload = (
    filename: string,
    contentType: string,
    content: Buffer,
  ): request.Test =>
    request(app.getHttpServer())
      .post(`/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .attach('file', content, { filename, contentType });

  beforeAll(async () => {
    app = await createTestApp();
    session = await registerUser(app);
    ({ taskId } = await createTask(app, session));
  });

  afterAll(async () => {
    // Removes the stored files from uploads/attachments.
    for (const id of uploadedIds) {
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}/attachments/${id}`)
        .set('Authorization', `Bearer ${session.accessToken}`);
    }
    await app.close();
  });

  it.each(ALLOWED_FILES)(
    'uploads %s',
    async (filename, contentType, content) => {
      const response = await upload(filename, contentType, content).expect(201);
      const body = response.body as AttachmentBody;
      uploadedIds.push(body.id);

      expect(body).toMatchObject({
        originalName: filename,
        mimeType: contentType,
      });
    },
  );

  it('rejects a type that is not allowed with a short message', async () => {
    const response = await upload(
      'page.html',
      'text/html',
      Buffer.from('<html></html>'),
    ).expect(400);

    expect(response.body).toMatchObject({
      message:
        'Unsupported file type. Allowed: PDF, PNG, JPEG, WebP, TXT, ZIP, DOCX, XLSX',
    });
  });

  it('rejects a file whose content does not match its extension', async () => {
    await upload('fake.png', 'image/png', Buffer.from('not an image')).expect(
      400,
    );
  });

  it('downloads with the original file name readable cross-origin', async () => {
    const content = Buffer.from('звіт за листопад');
    const uploaded = (
      await upload('звіт.txt', 'text/plain', content).expect(201)
    ).body as AttachmentBody;
    uploadedIds.push(uploaded.id);

    expect(uploaded.originalName).toBe('звіт.txt');

    const response = await request(app.getHttpServer())
      .get(`/tasks/${taskId}/attachments/${uploaded.id}/download`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .set('Origin', WEB_ORIGIN)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(response.body).toEqual(content);
    expect(response.headers['content-disposition']).toContain(
      `filename*=UTF-8''${encodeURIComponent('звіт.txt')}`,
    );
    expect(response.headers['access-control-expose-headers']).toBe(
      'Content-Disposition',
    );
  });

  it('still requires a bearer token to download', async () => {
    await request(app.getHttpServer())
      .get(`/tasks/${taskId}/attachments/${uploadedIds[0]}/download`)
      .expect(401);
  });
});
