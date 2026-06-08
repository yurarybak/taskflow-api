import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
