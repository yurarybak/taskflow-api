import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { NotificationsQueueModule } from '../queues/notifications-queue/notifications-queue.module';

@Module({
  imports: [TaskActivityModule, NotificationsQueueModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
