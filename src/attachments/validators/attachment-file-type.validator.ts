import { FileValidator } from '@nestjs/common';

import {
  ALLOWED_ATTACHMENT_TYPES_LABEL,
  getAttachmentFileType,
} from '../config/attachment-file-types';

export class AttachmentFileTypeValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file?.buffer) {
      return false;
    }

    return (
      getAttachmentFileType(file.originalname)?.matchesContent(file.buffer) ??
      false
    );
  }

  buildErrorMessage(): string {
    return `Unsupported file type. Allowed: ${ALLOWED_ATTACHMENT_TYPES_LABEL}`;
  }
}
