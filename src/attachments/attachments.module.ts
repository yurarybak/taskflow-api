import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';

@Module({
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
  imports: [TaskActivityModule],
})
export class AttachmentsModule {}
