import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';

import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class AvatarsController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get user avatar' })
  @ApiOkResponse({
    description: 'Avatar image returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Avatar not found',
  })
  @Get(':id/avatar')
  async getAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const storageName = await this.usersService.findAvatar(id);

    const filePath = join(process.cwd(), 'uploads', 'avatars', storageName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Avatar file not found');
    }

    return response.sendFile(filePath);
  }
}
