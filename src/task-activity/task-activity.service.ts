import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import type { CreateTaskActivityInput } from './types/create-task-activity.type';

@Injectable()
export class TaskActivityService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateTaskActivityInput) {
    return this.prisma.taskActivityLog.create({
      data: input,
    });
  }
}
