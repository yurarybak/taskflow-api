import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { NotificationsModule } from '../../notifications/notifications.module';
import { NOTIFICATIONS_QUEUE } from './notifications-queue.constants';
import { NotificationsQueueProcessor } from './notifications-queue.processor';
import { NotificationsQueueService } from './notifications-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: NOTIFICATIONS_QUEUE,
      adapter: BullMQAdapter,
    }),
    NotificationsModule,
  ],
  providers: [NotificationsQueueService, NotificationsQueueProcessor],
  exports: [NotificationsQueueService],
})
export class NotificationsQueueModule {}
