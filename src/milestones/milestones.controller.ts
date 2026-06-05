import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneResponseDto } from './dto/responses/milestone-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

// TODO:
// POST   /projects/:projectId/milestones
// GET    /projects/:projectId/milestones
// GET    /projects/:projectId/milestones/:id
// PATCH  /projects/:projectId/milestones/:id
// DELETE /projects/:projectId/milestones/:id
// PATCH  /projects/:projectId/milestones/:id/complete
// PATCH  /projects/:projectId/milestones/:id/reopen

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/projects/:projectId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @ApiOperation({ summary: 'Create milestone' })
  @ApiCreatedResponse({
    description: 'Milestone created successfully',
    type: MilestoneResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  @ApiConflictResponse({
    description: 'Milestone with this name already exists',
  })
  @ApiBadRequestResponse({
    description: 'Start date cannot be later than due date',
  })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Body() createMilestoneDto: CreateMilestoneDto,
  ) {
    return this.milestonesService.create(
      user.id,
      projectId,
      createMilestoneDto,
    );
  }

  @ApiOperation({ summary: 'Get project milestones' })
  @ApiOkResponse({
    description: 'Milestones returned successfully',
    type: [MilestoneResponseDto],
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
    @Param('projectId') projectId: string,
  ) {
    return this.milestonesService.findAll(user.id, projectId);
  }

  @ApiOperation({ summary: 'Get milestone by id' })
  @ApiOkResponse({
    description: 'Milestone returned successfully',
    type: MilestoneResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Milestone not found',
  })
  @Get('/:id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') milestoneId: string,
  ) {
    return this.milestonesService.findOne(user.id, projectId, milestoneId);
  }

  @ApiOperation({ summary: 'Update milestone' })
  @ApiOkResponse({
    description: 'Milestone updated successfully',
    type: MilestoneResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Milestone not found',
  })
  @ApiBadRequestResponse({
    description: 'Start date cannot be later than due date',
  })
  @Patch('/:id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') milestoneId: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.milestonesService.update(
      user.id,
      projectId,
      milestoneId,
      updateMilestoneDto,
    );
  }

  @ApiOperation({ summary: 'Delete milestone' })
  @ApiOkResponse({
    description: 'Milestone deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Milestone not found',
  })
  @Delete('/:id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') milestoneId: string,
  ) {
    await this.milestonesService.remove(user.id, projectId, milestoneId);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Complete milestone' })
  @ApiOkResponse({
    description: 'Milestone completed successfully',
    type: MilestoneResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Milestone not found',
  })
  @Patch('/:id/complete')
  async complete(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') milestoneId: string,
  ) {
    await this.milestonesService.complete(user.id, projectId, milestoneId);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Reopen milestone' })
  @ApiOkResponse({
    description: 'Milestone reopened successfully',
    type: MilestoneResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Milestone not found',
  })
  @Patch('/:id/reopen')
  async reopen(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') milestoneId: string,
  ) {
    await this.milestonesService.reopen(user.id, projectId, milestoneId);

    return {
      success: true,
    };
  }
}
