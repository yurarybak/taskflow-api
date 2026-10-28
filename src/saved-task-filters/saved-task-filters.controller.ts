import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SavedTaskFiltersService } from './saved-task-filters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { CreateSavedTaskFilterDto } from './dto/create-saved-task-filters.dto';
import { UpdateSavedTaskFilterDto } from './dto/update-saved-task-filters.dto';
import { SavedTaskFilterResponseDto } from './dto/responses/saved-task-filter-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { SavedTaskFilter } from '../../generated/prisma/client';

// TODO:
// POST   /projects/:projectId/saved-filters
// GET    /projects/:projectId/saved-filters
// GET    /projects/:projectId/saved-filters/:id
// PATCH  /projects/:projectId/saved-filters/:id
// DELETE /projects/:projectId/saved-filters/:id

ApiBearerAuth();
@ApiTags('Saved task filters')
@UseGuards(JwtAuthGuard)
@Controller('/projects/:projectId/saved-filters')
export class SavedTaskFiltersController {
  constructor(
    private readonly savedTaskFiltersService: SavedTaskFiltersService,
  ) {}

  @ApiOperation({ summary: 'Create saved task filter' })
  @ApiCreatedResponse({
    description: 'Saved task filter created successfully',
    type: SavedTaskFilterResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  @ApiConflictResponse({
    description: 'Saved filter with this name already exists',
  })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createSavedTaskFilterDto: CreateSavedTaskFilterDto,
  ): Promise<SavedTaskFilter> {
    return this.savedTaskFiltersService.create(
      user.id,
      projectId,
      createSavedTaskFilterDto,
    );
  }

  @ApiOperation({ summary: 'Get current user saved task filters' })
  @ApiOkResponse({
    description: 'Saved task filters returned successfully',
    type: [SavedTaskFilterResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<SavedTaskFilter[]> {
    return this.savedTaskFiltersService.findAll(user.id, projectId);
  }

  @ApiOperation({ summary: 'Get saved task filter by id' })
  @ApiOkResponse({
    description: 'Saved task filter returned successfully',
    type: SavedTaskFilterResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Saved filter not found',
  })
  @Get('/:id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SavedTaskFilter> {
    return this.savedTaskFiltersService.findOne(user.id, projectId, id);
  }

  @ApiOperation({ summary: 'Update saved task filter' })
  @ApiOkResponse({
    description: 'Saved task filter updated successfully',
    type: SavedTaskFilterResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Saved filter not found',
  })
  @ApiConflictResponse({
    description: 'Saved filter with this name already exists',
  })
  @Patch('/:id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSavedTaskFilterDto: UpdateSavedTaskFilterDto,
  ): Promise<SavedTaskFilter> {
    return this.savedTaskFiltersService.update(
      user.id,
      projectId,
      id,
      updateSavedTaskFilterDto,
    );
  }

  @ApiOperation({ summary: 'Delete saved task filter' })
  @ApiOkResponse({
    description: 'Saved task filter deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Saved filter not found',
  })
  @Delete('/:id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.savedTaskFiltersService.remove(user.id, projectId, id);

    return {
      success: true,
    };
  }
}
