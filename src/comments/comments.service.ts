import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../../generated/prisma/enums';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async ensureCommentAuthor(commentId: string, userId: string) {
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

  private async getCommentWithMembership(commentId: string, userId: string) {
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

  private getCommentResponse(id: string) {
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

  async create(
    userId: string,
    taskId: string,
    createCommentDto: CreateCommentDto,
  ) {
    await this.ensureTaskMember(taskId, userId);

    const { content } = createCommentDto;

    return this.prisma.taskComment.create({
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
  }

  async update(
    userId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ) {
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

  async getComment(commentId: string, userId: string) {
    await this.getCommentWithMembership(commentId, userId);

    const comment = await this.getCommentResponse(commentId);

    return comment;
  }

  async delete(userId: string, commentId: string) {
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

    return {
      success: true,
    };
  }
}
