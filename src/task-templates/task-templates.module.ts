import { Module } from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { TaskTemplatesController } from './task-templates.controller';

@Module({
  providers: [TaskTemplatesService],
  controllers: [TaskTemplatesController]
})
export class TaskTemplatesModule {}
