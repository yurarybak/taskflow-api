import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import type { CurrentUser } from '../auth/types/current-user.type';

import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { PaginatedWorkspacesResponseDto } from './dto/responses/paginated-workspaces-response.dto';
import { WorkspaceResponseDto } from './dto/responses/workspace-response.dto';
import { WorkspaceMemberResponseDto } from './dto/responses/workspace-member-response.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) { }

  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiCreatedResponse({
    type: WorkspaceResponseDto,
    description: 'Workspace created successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post()
  createWorkspace(
    @GetCurrentUser() user: CurrentUser,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.id, createWorkspaceDto);
  }

  @ApiOperation({
    summary: 'Get all workspaces owned by the authenticated user',
  })
  @ApiOkResponse({
    type: PaginatedWorkspacesResponseDto,
    description: 'List of workspaces retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(@GetCurrentUser() user: CurrentUser) {
    return this.workspacesService.findAllByOwner(user.id);
  }

  @ApiOperation({ summary: 'Get all members of a workspace' })
  @ApiOkResponse({
    type: [WorkspaceMemberResponseDto],
    description: 'List of workspace members retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Get(':id/members')
  findMembers(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.findMembers(user.id, workspaceId);
  }

  @ApiOperation({ summary: 'Add a member to a workspace' })
  @ApiCreatedResponse({
    type: WorkspaceMemberResponseDto,
    description: 'Member added successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Post(':id/members')
  addMember(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
    @Body() addWorkspaceMemberDto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(
      user.id,
      workspaceId,
      addWorkspaceMemberDto,
    );
  }

  @ApiOperation({ summary: "Update a workspace member's role" })
  @ApiOkResponse({
    type: WorkspaceMemberResponseDto,
    description: 'Member role updated successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace or member not found' })
  @Patch(':id/members/:memberId')
  updateMember(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() updateWorkspaceMemberDto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspacesService.updateMember(
      user.id,
      workspaceId,
      memberId,
      updateWorkspaceMemberDto,
    );
  }

  @ApiOperation({ summary: 'Remove a member from a workspace' })
  @ApiOkResponse({
    type: WorkspaceMemberResponseDto,
    description: 'Member removed successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace or member not found' })
  @Delete(':id/members/:memberId')
  removeMember(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(user.id, workspaceId, memberId);
  }

  @ApiOperation({ summary: 'Get a specific workspace by ID' })
  @ApiOkResponse({
    type: WorkspaceResponseDto,
    description: 'Workspace retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Get(':id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.findOneByOwner(user.id, workspaceId);
  }

  @ApiOperation({ summary: 'Update a workspace by ID' })
  @ApiOkResponse({
    type: WorkspaceResponseDto,
    description: 'Workspace updated successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Patch(':id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(
      user.id,
      workspaceId,
      updateWorkspaceDto,
    );
  }

  @ApiOperation({ summary: 'Delete a workspace by ID' })
  @ApiOkResponse({
    type: WorkspaceResponseDto,
    description: 'Workspace deleted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Delete(':id')
  remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.remove(user.id, workspaceId);
  }
}
