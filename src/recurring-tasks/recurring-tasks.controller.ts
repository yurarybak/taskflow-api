import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Recurring tasks')
@Controller('recurring-tasks')
export class RecurringTasksController {}
