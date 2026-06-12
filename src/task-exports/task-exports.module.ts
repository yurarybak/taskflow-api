import { Module } from '@nestjs/common';
import { TaskExportsService } from './task-exports.service';
import { TaskExportsController } from './task-exports.controller';

@Module({
  providers: [TaskExportsService],
  controllers: [TaskExportsController]
})
export class TaskExportsModule {}
