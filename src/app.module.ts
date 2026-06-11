import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: Number(configService.getOrThrow<string>('REDIS_PORT')),
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
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
  ],
})
export class AppModule {}
