import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { TaskActivityType } from '../../generated/prisma/enums';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { ToggleChecklistItemDto } from './dto/toggle-checklist-item.dto';

@Injectable()
export class ChecklistItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
  ) {}

  private async ensureTaskMember(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async findItemByTaskMember(
    taskId: string,
    itemId: string,
    userId: string,
  ) {
    const item = await this.prisma.taskChecklistItem.findFirst({
      where: {
        id: itemId,
        taskId: taskId,
        task: {
          project: {
            workspace: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Task not found');
    }

    return item;
  }

  async create(
    userId: string,
    taskId: string,
    createChecklistItemDto: CreateChecklistItemDto,
  ) {
    const task = await this.ensureTaskMember(taskId, userId);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.taskChecklistItem.create({
        data: {
          taskId: task.id,
          ...createChecklistItemDto,
        },
      });

      await this.taskActivityService.create(
        {
          taskId: task.id,
          actorId: userId,
          type: TaskActivityType.CHECKLIST_ITEM_CREATED,
          metadata: {
            checklistItemId: item.id,
            title: item.title,
          },
        },
        tx,
      );

      return item;
    });
  }

  async update(
    userId: string,
    taskId: string,
    checklistItemId: string,
    updateChecklistItemDto: UpdateChecklistItemDto,
  ) {
    const item = await this.findItemByTaskMember(
      taskId,
      checklistItemId,
      userId,
    );

    return this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.taskChecklistItem.update({
        where: {
          id: checklistItemId,
          taskId,
        },
        data: updateChecklistItemDto,
      });

      await this.taskActivityService.create(
        {
          taskId,
          actorId: userId,
          type: TaskActivityType.CHECKLIST_ITEM_CREATED,
          metadata: {
            checklistItemId: item.id,
            from: {
              title: item.title,
              isCompleted: item.isCompleted,
              position: item.position,
            },
            to: {
              title: updatedItem.title,
              isCompleted: updatedItem.isCompleted,
              position: updatedItem.position,
            },
          },
        },
        tx,
      );

      return updatedItem;
    });
  }

  async toggle(
    userId: string,
    taskId: string,
    checklistItemId: string,
    toggleChecklistItemDto: ToggleChecklistItemDto,
  ) {
    const item = await this.findItemByTaskMember(
      taskId,
      checklistItemId,
      userId,
    );

    return this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.taskChecklistItem.update({
        where: {
          id: checklistItemId,
          taskId,
        },
        data: {
          isCompleted: toggleChecklistItemDto.isCompleted,
        },
      });

      const taskActivityType = toggleChecklistItemDto.isCompleted
        ? TaskActivityType.CHECKLIST_ITEM_COMPLETED
        : TaskActivityType.CHECKLIST_ITEM_REOPENED;

      await this.taskActivityService.create(
        {
          taskId,
          actorId: userId,
          type: taskActivityType,
          metadata: {
            checklistItemId: item.id,
            title: item.title,
          },
        },
        tx,
      );

      return updatedItem;
    });
  }

  async remove(userId: string, taskId: string, checklistItemId: string) {
    const item = await this.findItemByTaskMember(
      taskId,
      checklistItemId,
      userId,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.taskChecklistItem.delete({
        where: {
          id: checklistItemId,
        },
      });

      await this.taskActivityService.create(
        {
          taskId,
          actorId: userId,
          type: TaskActivityType.CHECKLIST_ITEM_DELETED,
          metadata: {
            checklistItemId: item.id,
            title: item.title,
          },
        },
        tx,
      );
    });
  }

  async findAllByTask(userId: string, taskId: string) {
    await this.ensureTaskMember(taskId, userId);

    return this.prisma.taskChecklistItem.findMany({
      where: {
        taskId,
      },
      orderBy: [
        {
          position: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }
}
