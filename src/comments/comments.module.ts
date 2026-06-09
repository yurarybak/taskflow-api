import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TaskActivityModule, NotificationsModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
