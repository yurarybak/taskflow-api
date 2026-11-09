import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  // upgrade-insecure-requests would break Swagger UI and Bull Board assets when served over plain HTTP.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { upgradeInsecureRequests: null },
      },
    }),
  );

  const corsOrigins =
    configService.get<string>('CORS_ORIGINS')?.split(',') ?? [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    // Lets browser clients read the server-provided file name of downloads.
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
