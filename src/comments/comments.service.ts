import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { NotificationsQueueService } from '../queues/notifications-queue/notifications-queue.service';
import {
  WorkspaceRole,
  TaskActivityType,
  NotificationType,
} from '../../generated/prisma/enums';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FindCommentsQueryDto } from './dto/find-comments-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';
import { extractMentionUserIds } from '../common/utils/extract-mention-user-ids';

import type {
  Prisma,
  Project,
  Task,
  TaskComment,
  TaskWatcher,
  Workspace,
  WorkspaceMember,
} from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type { TaskCommentWithAuthor } from './types/task-comment-with-author.type';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
    private readonly notificationsQueueService: NotificationsQueueService,
  ) {}

  private async ensureTaskMember(
    taskId: string,
    userId: string,
  ): Promise<
    Task & {
      watchers: TaskWatcher[];
      project: Project & {
        workspace: Workspace & { members: Pick<WorkspaceMember, 'userId'>[] };
      };
    }
  > {
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
      include: {
        watchers: true,
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  select: {
                    userId: true,
                  },
                },
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

  private async ensureCommentAuthor(
    commentId: string,
    userId: string,
  ): Promise<TaskComment> {
    const comment = await this.prisma.taskComment.findFirst({
      where: {
        id: commentId,
        authorId: userId,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  private async getCommentWithMembership(
    commentId: string,
    userId: string,
  ): Promise<{
    comment: TaskComment & {
      task: Task & {
        project: Project & {
          workspace: Workspace & { members: WorkspaceMember[] };
        };
      };
    };
    membership: WorkspaceMember;
  }> {
    const comment = await this.prisma.taskComment.findFirst({
      where: {
        id: commentId,
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
      include: {
        task: {
          include: {
            project: {
              include: {
                workspace: {
                  include: {
                    members: {
                      where: {
                        userId,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const membership = comment.task.project.workspace.members[0];

    if (!membership) {
      throw new NotFoundException('Comment not found');
    }

    return {
      comment,
      membership,
    };
  }

  private getCommentResponse(
    id: string,
  ): Promise<TaskCommentWithAuthor | null> {
    return this.prisma.taskComment.findUnique({
      where: {
        id,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  private async createTaskCommentNotification(
    actorId: string,
    watcherIds: string[],
    task: {
      id: string;
      title: string;
      projectId: string;
    },
  ): Promise<void> {
    const recipientIds = watcherIds.filter(
      (watcherId) => watcherId !== actorId,
    );

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.notificationsQueueService.addCreateNotificationJob({
          userId: recipientId,
          type: NotificationType.TASK_COMMENTED,
          title: 'New comment on a task',
          message: task.title,
          data: {
            taskId: task.id,
            projectId: task.projectId,
          },
        }),
      ),
    );
  }

  private async createTaskMentionedNotifications(
    content: string,
    actorId: string,
    task: {
      id: string;
      title: string;
      projectId: string;
      project: {
        workspace: {
          members: {
            userId: string;
          }[];
        };
      };
    },
    excludedUserIds: string[],
  ): Promise<void> {
    const mentionedUserIds = extractMentionUserIds(content);

    const workspaceMemberIds = new Set(
      task.project.workspace.members.map((member) => member.userId),
    );

    const recipientIds = mentionedUserIds.filter(
      (mentionedUserId) =>
        mentionedUserId !== actorId &&
        workspaceMemberIds.has(mentionedUserId) &&
        !excludedUserIds.includes(mentionedUserId),
    );

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.notificationsQueueService.addCreateNotificationJob({
          userId: recipientId,
          type: NotificationType.TASK_MENTIONED,
          title: 'You were mentioned in a comment',
          message: task.title,
          data: {
            taskId: task.id,
            projectId: task.projectId,
          },
        }),
      ),
    );
  }

  async create(
    userId: string,
    taskId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<TaskCommentWithAuthor> {
    const task = await this.ensureTaskMember(taskId, userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const { content } = createCommentDto;

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.taskComment.create({
        data: {
          content,
          taskId,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      await this.taskActivityService.create(
        {
          taskId,
          actorId: userId,
          type: TaskActivityType.COMMENT_CREATED,
          metadata: {
            commentId: comment.id,
          },
        },
        tx,
      );

      const watcherIds = task.watchers
        .map((watcher) => watcher.userId)
        .filter((watcherId) => watcherId !== userId);

      await this.createTaskCommentNotification(userId, watcherIds, task);

      await this.createTaskMentionedNotifications(
        content,
        userId,
        task,
        watcherIds,
      );

      return comment;
    });
  }

  async update(
    userId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<TaskCommentWithAuthor> {
    await this.ensureCommentAuthor(commentId, userId);

    return this.prisma.taskComment.update({
      where: {
        id: commentId,
        authorId: userId,
      },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async getComment(
    commentId: string,
    userId: string,
  ): Promise<TaskCommentWithAuthor | null> {
    await this.getCommentWithMembership(commentId, userId);

    const comment = await this.getCommentResponse(commentId);

    return comment;
  }

  async delete(userId: string, commentId: string): Promise<void> {
    const { comment, membership } = await this.getCommentWithMembership(
      commentId,
      userId,
    );

    // Owners and admins can delete any comment, while members can only delete their own comments
    const canDeleteAnyComment =
      membership.role === WorkspaceRole.OWNER ||
      membership.role === WorkspaceRole.ADMIN;

    if (!canDeleteAnyComment && comment.authorId !== userId) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.taskComment.delete({
      where: {
        id: commentId,
      },
    });
  }

  async findAllByTask(
    taskId: string,
    userId: string,
    query: FindCommentsQueryDto,
  ): Promise<PaginatedResponse<TaskComment>> {
    await this.ensureTaskMember(taskId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskCommentWhereInput = {
      taskId,
    };

    const [comments, total] = await Promise.all([
      this.prisma.taskComment.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.taskComment.count({
        where,
      }),
    ]);

    return {
      data: comments,
      meta: createPaginationMeta(page, limit, total),
    };
  }
}
