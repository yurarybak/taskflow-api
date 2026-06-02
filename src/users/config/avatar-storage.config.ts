import { randomUUID } from 'crypto';
import { extname } from 'path';

import { diskStorage } from 'multer';

export const avatarStorage = diskStorage({
  destination: './uploads/avatars',
  filename: (_request, file, callback) => {
    const extension = extname(file.originalname);
    const storageName = `${randomUUID()}${extension}`;

    callback(null, storageName);
  },
});
