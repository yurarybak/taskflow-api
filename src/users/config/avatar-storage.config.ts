import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

import { diskStorage } from 'multer';

// The extension comes from the allowed MIME type, never from the client's file name:
// it decides the Content-Type the public avatar URL is served with.
const AVATAR_EXTENSIONS = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

// '.jpeg' covers avatars stored when the extension still came from the file name.
export const ALLOWED_AVATAR_EXTENSIONS = new Set([
  ...AVATAR_EXTENSIONS.values(),
  '.jpeg',
]);

export const avatarStorage = diskStorage({
  destination: './uploads/avatars',
  filename: (_request, file, callback) => {
    const extension = AVATAR_EXTENSIONS.get(file.mimetype) ?? '';

    callback(null, `${randomUUID()}${extension}`);
  },
});

export function avatarFileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!AVATAR_EXTENSIONS.has(file.mimetype)) {
    // An HttpException passes through Nest's Multer error handling as is (400, not 500).
    callback(
      new BadRequestException('Only jpeg, png and webp images are allowed'),
      false,
    );
    return;
  }

  callback(null, true);
}
