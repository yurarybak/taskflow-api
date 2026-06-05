import { Module } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';

@Module({
  imports: [TaskActivityModule],
  providers: [MilestonesService],
  controllers: [MilestonesController],
})
export class MilestonesModule {}
