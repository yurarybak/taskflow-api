import {
  Controller,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Post,
  Param,
  Get,
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
}
