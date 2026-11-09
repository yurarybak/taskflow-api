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
import { extname, join } from 'path';
import type { Response } from 'express';

import { UsersService } from './users.service';
import { ALLOWED_AVATAR_EXTENSIONS } from './config/avatar-storage.config';

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

    // Avatars stored before the extension was derived from the MIME type may have any
    // extension (e.g. .html) and must not be served with that Content-Type.
    if (
      !ALLOWED_AVATAR_EXTENSIONS.has(extname(storageName).toLowerCase()) ||
      !existsSync(filePath)
    ) {
      throw new NotFoundException('Avatar file not found');
    }

    // Web clients on another origin embed avatars with <img>; every other route keeps
    // helmet's same-origin policy.
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    return response.sendFile(filePath);
  }
}
