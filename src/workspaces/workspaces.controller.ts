import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
