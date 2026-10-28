import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { EmailModule } from './email/email.module';
import { LabelsModule } from './labels/labels.module';
import { TaskActivityModule } from './task-activity/task-activity.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ChecklistItemsModule } from './checklist-items/checklist-items.module';
import { TaskWatchersModule } from './task-watchers/task-watchers.module';
import { MilestonesModule } from './milestones/milestones.module';
import { SavedTaskFiltersModule } from './saved-task-filters/saved-task-filters.module';
import { WorklogsModule } from './worklogs/worklogs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsQueueModule } from './queues/notifications-queue/notifications-queue.module';
import { EmailQueueModule } from './queues/email-queue/email-queue.module';
import { TaskRemindersModule } from './task-reminders/task-reminders.module';

import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { TaskExportsModule } from './task-exports/task-exports.module';
import { TaskExportQueueModule } from './queues/task-export-queue/task-export-queue.module';
import { TaskTemplatesModule } from './task-templates/task-templates.module';
import { RecurringTasksModule } from './recurring-tasks/recurring-tasks.module';
import { validateEnv } from './config/env.validation';
import { createWinstonOptions } from './logger/winston.config';
import { createBullBoardAuthMiddleware } from './queues/config/bull-board-auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createWinstonOptions(
          configService.get<string>('NODE_ENV') ?? 'development',
        ),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: Number(configService.getOrThrow<string>('REDIS_PORT')),
        },
      }),
    }),
    BullBoardModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        route: '/admin/queues',
        adapter: ExpressAdapter,
        middleware: createBullBoardAuthMiddleware(configService),
      }),
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    EmailModule,
    LabelsModule,
    TaskActivityModule,
    AttachmentsModule,
    ChecklistItemsModule,
    TaskWatchersModule,
    MilestonesModule,
    SavedTaskFiltersModule,
    WorklogsModule,
    NotificationsModule,
    NotificationsQueueModule,
    EmailQueueModule,
    TaskRemindersModule,
    TaskExportsModule,
    TaskExportQueueModule,
    TaskTemplatesModule,
    RecurringTasksModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // RequestIdMiddleware must run first: LoggingMiddleware reads req.id.
    consumer.apply(RequestIdMiddleware, LoggingMiddleware).forRoutes('*');
  }
}
