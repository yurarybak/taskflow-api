import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { EmailDeliveryError } from './errors/email-delivery.error';

const mockSend = jest.fn();

jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: (...args: unknown[]): unknown => mockSend(...args),
  },
}));

describe('EmailService', () => {
  let service: EmailService;
  const send = mockSend;

  // Mirrors the shape of @sendgrid/helpers ResponseError.
  const sendGridError = (code: number, body: unknown): Error =>
    Object.assign(new Error('Bad Request'), {
      code,
      response: { headers: {}, body },
    });

  beforeEach(async () => {
    send.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('SG.test-key') },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('returns the status code and SendGrid message id', async () => {
    send.mockResolvedValue([
      { statusCode: 202, headers: { 'x-message-id': 'msg-1' }, body: {} },
      {},
    ]);

    await expect(
      service.sendPasswordResetEmail('a@b.dev', 'Ann', 'http://reset'),
    ).resolves.toEqual({ statusCode: 202, messageId: 'msg-1' });
  });

  it('wraps SendGrid rejections with status code and provider errors', async () => {
    send.mockRejectedValue(
      sendGridError(400, {
        errors: [{ message: 'Invalid template', field: 'template_id' }],
      }),
    );

    const error: unknown = await service
      .sendPasswordResetEmail('a@b.dev', 'Ann', 'http://reset')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EmailDeliveryError);
    expect(error).toMatchObject({
      statusCode: 400,
      providerErrors: [{ message: 'Invalid template', field: 'template_id' }],
    });
  });

  it('parses provider errors from a string body', async () => {
    send.mockRejectedValue(
      sendGridError(401, JSON.stringify({ errors: [{ message: 'Bad key' }] })),
    );

    await expect(
      service.sendPasswordResetEmail('a@b.dev', 'Ann', 'http://reset'),
    ).rejects.toMatchObject({
      statusCode: 401,
      providerErrors: [{ message: 'Bad key' }],
    });
  });

  it('wraps network failures without a status code', async () => {
    send.mockRejectedValue(new Error('ECONNRESET'));

    await expect(
      service.sendPasswordResetEmail('a@b.dev', 'Ann', 'http://reset'),
    ).rejects.toMatchObject({
      message: 'Email delivery failed: ECONNRESET',
      statusCode: null,
      providerErrors: [],
    });
  });
});
