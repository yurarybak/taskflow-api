import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../../generated/prisma/enums';
@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTaskMember(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspace: {
            members: {
              some: { userId },
            },
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found or user is not a member');
    }

    return task;
  }

  private async getAttachmentWithMembership(id: string, userId: string) {
    const attachment = await this.prisma.taskAttachment.findFirst({
      where: {
        id,
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

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const membership = attachment.task.project.workspace.members[0];

    if (!membership) {
      throw new NotFoundException('Attachment not found');
    }

    return {
      attachment,
      membership,
    };
  }

  private async removeFileFromStorage(storageName: string) {
    try {
      const filePath = join(
        process.cwd(),
        'uploads',
        'attachments',
        storageName,
      );

      await unlink(filePath);
    } catch (error) {
      // Log the error but do not throw, since the main operation (like deleting the database record) has already succeeded
      console.error(`Failed to delete file from storage: ${error}`);
    }
  }

  async create(userId: string, taskId: string, file: Express.Multer.File) {
    try {
      await this.ensureTaskMember(userId, taskId);

      return this.prisma.taskAttachment.create({
        data: {
          originalName: file.originalname,
          storageName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          taskId,
          uploaderId: userId,
        },
      });
    } catch (error) {
      // If there's an error during the database operation, remove the uploaded file to prevent orphaned files
      await this.removeFileFromStorage(file.filename);
      throw error;
    }
  }

  async findAllByTask(taskId: string, userId: string) {
    await this.ensureTaskMember(userId, taskId);

    return this.prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(attachmentId: string, userId: string) {
    const { attachment } = await this.getAttachmentWithMembership(
      attachmentId,
      userId,
    );

    return attachment;
  }

  async delete(attachmentId: string, userId: string) {
    const { attachment, membership } = await this.getAttachmentWithMembership(
      attachmentId,
      userId,
    );

    // Only workspace owners, admins, or the uploader of the attachment can delete it
    const canDeleteAttachment =
      membership.role === WorkspaceRole.OWNER ||
      membership.role === WorkspaceRole.ADMIN;

    if (!canDeleteAttachment) {
      throw new NotFoundException('Attachment not found');
    }

    const canDeleteOwnAttachment = attachment.uploaderId === userId;

    if (!canDeleteOwnAttachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Delete the attachment record from the database
    await this.prisma.taskAttachment.delete({
      where: { id: attachment.id },
    });

    // Delete the file from the filesystem
    await this.removeFileFromStorage(attachment.storageName);
  }
}
