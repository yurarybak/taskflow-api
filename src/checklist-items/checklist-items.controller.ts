import {
  Controller,
  UseGuards,
  Post,
  Param,
  Body,
  Patch,
  Get,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { ChecklistItemsService } from './checklist-items.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { ToggleChecklistItemDto } from './dto/toggle-checklist-item.dto';
import { ChecklistItemResponseDto } from './dto/responses/checklist-item-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

// TODO:
// POST   /tasks/:taskId/checklist-items
// GET    /tasks/:taskId/checklist-items
// PATCH  /tasks/:taskId/checklist-items/:id
// DELETE /tasks/:taskId/checklist-items/:id
// PATCH  /tasks/:taskId/checklist-items/:id/toggle

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/checklist-items')
export class ChecklistItemsController {
  constructor(private readonly checklistItemsService: ChecklistItemsService) {}

  @ApiOperation({ summary: 'Create checklist item' })
  @ApiCreatedResponse({
    description: 'Checklist item created successfully',
    type: ChecklistItemResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
  })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Body() createChecklistItemDto: CreateChecklistItemDto,
  ) {
    return this.checklistItemsService.create(
      user.id,
      taskId,
      createChecklistItemDto,
    );
  }

  @ApiOperation({ summary: 'Update checklist item' })
  @ApiOkResponse({
    description: 'Checklist item updated successfully',
    type: ChecklistItemResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Checklist item not found',
  })
  @Patch('/:id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Param('id') checklistItemId: string,
    @Body() updateChecklistItemDto: UpdateChecklistItemDto,
  ) {
    return this.checklistItemsService.update(
      user.id,
      taskId,
      checklistItemId,
      updateChecklistItemDto,
    );
  }

  @ApiOperation({ summary: 'Toggle checklist item completion' })
  @ApiOkResponse({
    description: 'Checklist item toggled successfully',
    type: ChecklistItemResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Checklist item not found',
  })
  @Patch('/:id/toggle')
  toggle(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Param('id') checklistItemId: string,
    @Body() toggleChecklistItemDto: ToggleChecklistItemDto,
  ) {
    return this.checklistItemsService.toggle(
      user.id,
      taskId,
      checklistItemId,
      toggleChecklistItemDto,
    );
  }

  @ApiOperation({ summary: 'Delete checklist item' })
  @ApiOkResponse({
    description: 'Checklist item deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Checklist item not found',
  })
  @Delete('/:id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Param('id') checklistItemId: string,
  ) {
    await this.checklistItemsService.remove(user.id, taskId, checklistItemId);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Get task checklist items' })
  @ApiOkResponse({
    description: 'Checklist items returned successfully',
    type: [ChecklistItemResponseDto],
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
    return this.checklistItemsService.findAllByTask(user.id, taskId);
  }
}
