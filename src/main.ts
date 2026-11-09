import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { registerFatalErrorLogging } from './logger/fatal-error-logging';

async function bootstrap(): Promise<void> {
  registerFatalErrorLogging(new Logger('Process'));

  // Buffer startup logs until the Winston logger replaces Nest's default one.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const configService = app.get(ConfigService);

  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('TaskFlow backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(configService.get<number>('PORT') ?? 3000);
}
void bootstrap();
