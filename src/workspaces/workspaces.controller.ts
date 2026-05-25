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
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createWorkspace(
    @GetCurrentUser() user: { id: string; email: string },
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.id, createWorkspaceDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@GetCurrentUser() user: { id: string; email: string }) {
    return this.workspacesService.findAllByOwner(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.findOneByOwner(user.id, workspaceId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('id') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(
      user.id,
      workspaceId,
      updateWorkspaceDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.remove(user.id, workspaceId);
  }
}
