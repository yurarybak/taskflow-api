import {
  Controller,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Post,
  Param,
  Get,
  NotFoundException,
  Res,
  Delete,
  ParseFilePipe,
  MaxFileSizeValidator,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';
import { AttachmentFileTypeValidator } from './validators/attachment-file-type.validator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { AttachmentResponseDto } from './dto/responses/attachment-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { TaskAttachment } from '../../generated/prisma/client';

@ApiTags('Task attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @ApiOperation({ summary: 'Upload task attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({
    description: 'Attachment uploaded successfully',
    type: AttachmentResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
  })
  @ApiBadRequestResponse({
    description: 'File is missing or its type is not allowed',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // Kept in memory so the content can be checked before anything is written to disk.
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      // Browsers send non-ASCII file names as raw UTF-8; Multer defaults to latin1.
      defParamCharset: 'utf8',
    }),
  )
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * 1024 * 1024,
          }),
          new AttachmentFileTypeValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<TaskAttachment> {
    return this.attachmentsService.create(user.id, taskId, file);
  }

  @ApiOperation({ summary: 'Get attachments for a task' })
  @ApiOkResponse({
    description: 'List of attachments for the specified task',
    type: [AttachmentResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
  })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<TaskAttachment[]> {
    return this.attachmentsService.findAllByTask(taskId, user.id);
  }

  @ApiOperation({ summary: 'Download task attachment' })
  @ApiOkResponse({
    description: 'Attachment file returned successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Attachment not found',
  })
  @Get(':attachmentId/download')
  async download(
    @GetCurrentUser() user: CurrentUser,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res() response: Response,
  ): Promise<void> {
    const attachment = await this.attachmentsService.findOne(
      attachmentId,
      user.id,
    );

    // The file path is constructed based on the storage name of the attachment
    const filePath = join(
      process.cwd(),
      'uploads',
      'attachments',
      attachment.storageName,
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException('Attachment file not found');
    }

    return response.download(filePath, attachment.originalName);
  }

  @ApiOperation({ summary: 'Delete task attachment' })
  @ApiOkResponse({
    description: 'Attachment deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Attachment not found',
  })
  @Delete(':attachmentId')
  async delete(
    @GetCurrentUser() user: CurrentUser,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ): Promise<{ success: boolean }> {
    await this.attachmentsService.delete(attachmentId, user.id);

    return {
      success: true,
    };
  }
}
