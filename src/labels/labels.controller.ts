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
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LabelsService } from './labels.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

import type { CurrentUser } from '../auth/types/current-user.type';

import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { LabelResponseDto } from './dto/responses/label-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

@ApiBearerAuth()
@Controller('workspace/:workspaceId/labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private readonly labelService: LabelsService) {}

  @ApiOperation({ summary: 'Create label' })
  @ApiCreatedResponse({
    description: 'Label created successfully',
    type: LabelResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  @ApiConflictResponse({
    description: 'Label with this name already exists',
  })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Body() createLabelDto: CreateLabelDto,
  ) {
    return this.labelService.create(workspaceId, user.id, createLabelDto);
  }

  @ApiOperation({ summary: 'Update label' })
  @ApiOkResponse({
    description: 'Label updated successfully',
    type: LabelResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Label not found',
  })
  @Patch('/:labelId')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Param('labelId') labelId: string,
    @Body() updateLabelDto: UpdateLabelDto,
  ) {
    return this.labelService.update(
      workspaceId,
      user.id,
      labelId,
      updateLabelDto,
    );
  }

  @ApiOperation({ summary: 'Get label by id' })
  @ApiOkResponse({
    description: 'Label returned successfully',
    type: LabelResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Label not found',
  })
  @Get('/:labelId')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelService.findOne(workspaceId, user.id, labelId);
  }

  @ApiOperation({ summary: 'Delete label' })
  @ApiOkResponse({
    description: 'Label deleted successfully',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Label not found',
  })
  @Delete('/:labelId')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Param('labelId') labelId: string,
  ) {
    await this.labelService.remove(workspaceId, user.id, labelId);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Get workspace labels' })
  @ApiOkResponse({
    description: 'Labels returned successfully',
    type: [LabelResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Workspace not found',
  })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.labelService.findAll(workspaceId, user.id);
  }
}
