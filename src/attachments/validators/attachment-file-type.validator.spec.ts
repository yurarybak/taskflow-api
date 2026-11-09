import { AttachmentFileTypeValidator } from './attachment-file-type.validator';

const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);

const fileOf = (originalname: string, buffer?: Buffer): Express.Multer.File =>
  ({ originalname, buffer }) as Express.Multer.File;

describe('AttachmentFileTypeValidator', () => {
  const validator = new AttachmentFileTypeValidator();

  it.each([
    ['report.pdf', Buffer.from('%PDF-1.7\n')],
    [
      'pixel.png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
    ],
    ['photo.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
    ['photo.JPEG', Buffer.from([0xff, 0xd8, 0xff, 0xdb])],
    ['image.webp', Buffer.from('RIFF\x10\x00\x00\x00WEBPVP8 ', 'latin1')],
    ['notes.txt', Buffer.from('<Button> is fine in plain text')],
    ['archive.zip', ZIP],
    ['doc.docx', ZIP],
    ['sheet.xlsx', ZIP],
  ])('accepts %s', (name, buffer) => {
    expect(validator.isValid(fileOf(name, buffer))).toBe(true);
  });

  it.each([
    ['script.exe', Buffer.from('MZ')],
    ['page.html', Buffer.from('<html></html>')],
    ['no-extension', Buffer.from('%PDF-1.7')],
  ])('rejects the not allowed type %s', (name, buffer) => {
    expect(validator.isValid(fileOf(name, buffer))).toBe(false);
  });

  it.each([
    ['fake.png', Buffer.from('just text')],
    ['fake.pdf', ZIP],
    ['binary.txt', Buffer.from([0x48, 0x00, 0x49])],
  ])(
    'rejects %s whose content does not match the extension',
    (name, buffer) => {
      expect(validator.isValid(fileOf(name, buffer))).toBe(false);
    },
  );

  it('rejects a file without a buffer (disk storage)', () => {
    expect(validator.isValid(fileOf('report.pdf'))).toBe(false);
  });

  it('builds a short message listing allowed types', () => {
    expect(validator.buildErrorMessage()).toBe(
      'Unsupported file type. Allowed: PDF, PNG, JPEG, WebP, TXT, ZIP, DOCX, XLSX',
    );
  });
});
