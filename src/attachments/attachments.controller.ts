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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';
import { attachmentStorage } from './config/attachment-storage.config';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { AttachmentResponseDto } from './dto/responses/attachment-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: attachmentStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
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
    @Param('taskId') taskId: string,
  ) {
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
    @Param('attachmentId') attachmentId: string,
    @Res() response: Response,
  ) {
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
}
