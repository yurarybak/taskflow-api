import { Module } from '@nestjs/common';
import { RecurringTasksService } from './recurring-tasks.service';
import { RecurringTasksController } from './recurring-tasks.controller';

@Module({
  providers: [RecurringTasksService],
  controllers: [RecurringTasksController]
})
export class RecurringTasksModule {}
