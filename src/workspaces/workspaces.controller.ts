import { ApiBearerAuth } from '@nestjs/swagger';
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

import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CurrentUser } from '../auth/types/current-user.type';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  createWorkspace(
    @GetCurrentUser() user: CurrentUser,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.id, createWorkspaceDto);
  }

  @Get()
  findAll(@GetCurrentUser() user: CurrentUser) {
    return this.workspacesService.findAllByOwner(user.id);
  }

  @Get(':id/members')
  findMembers(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.findMembers(user.id, workspaceId);
  }

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

  @Get(':id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.findOneByOwner(user.id, workspaceId);
  }

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

  @Delete(':id')
  remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.remove(user.id, workspaceId);
  }
}
