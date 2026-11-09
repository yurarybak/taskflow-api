import { extname } from 'path';

interface AttachmentFileType {
  mimeType: string;
  matchesContent: (buffer: Buffer) => boolean;
}

const startsWith =
  (signature: string | number[]) =>
  (buffer: Buffer): boolean => {
    const expected =
      typeof signature === 'string'
        ? Buffer.from(signature, 'latin1')
        : Buffer.from(signature);

    return buffer.subarray(0, expected.length).equals(expected);
  };

const isZip = startsWith([0x50, 0x4b, 0x03, 0x04]);

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.toString('latin1', 0, 4) === 'RIFF' &&
    buffer.toString('latin1', 8, 12) === 'WEBP'
  );
}

// Plain text has no magic number; a NUL byte means binary content.
function isPlainText(buffer: Buffer): boolean {
  return !buffer.includes(0);
}

const jpeg: AttachmentFileType = {
  mimeType: 'image/jpeg',
  matchesContent: startsWith([0xff, 0xd8, 0xff]),
};

// The type comes from the extension (it also drives Content-Type on download);
// the content check rejects files whose bytes don't match that extension.
// DOCX and XLSX are ZIP containers, so only the ZIP signature is checked.
const ATTACHMENT_FILE_TYPES = new Map<string, AttachmentFileType>([
  [
    '.pdf',
    { mimeType: 'application/pdf', matchesContent: startsWith('%PDF-') },
  ],
  [
    '.png',
    {
      mimeType: 'image/png',
      matchesContent: startsWith([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]),
    },
  ],
  ['.jpg', jpeg],
  ['.jpeg', jpeg],
  [
    '.webp',
    {
      mimeType: 'image/webp',
      matchesContent: isWebp,
    },
  ],
  ['.txt', { mimeType: 'text/plain', matchesContent: isPlainText }],
  ['.zip', { mimeType: 'application/zip', matchesContent: isZip }],
  [
    '.docx',
    {
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      matchesContent: isZip,
    },
  ],
  [
    '.xlsx',
    {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      matchesContent: isZip,
    },
  ],
]);

export const ALLOWED_ATTACHMENT_TYPES_LABEL =
  'PDF, PNG, JPEG, WebP, TXT, ZIP, DOCX, XLSX';

export function getAttachmentFileType(
  originalName: string,
): AttachmentFileType | undefined {
  return ATTACHMENT_FILE_TYPES.get(extname(originalName).toLowerCase());
}
