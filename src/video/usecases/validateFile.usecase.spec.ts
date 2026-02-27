import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ValidateFileUseCase } from './validateFile.usecase';
import { Video, VideoStatus } from '../domain/video.entity';

describe('ValidateFileUseCase', () => {
  let useCase: ValidateFileUseCase;

  const userId = 'user-123';

  const createMockFile = (overrides?: Partial<Express.Multer.File>): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'video.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 5 * 1024 * 1024,
    destination: '/tmp',
    filename: 'video',
    path: '/tmp/video',
    buffer: Buffer.from('content'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateFileUseCase],
    }).compile();

    useCase = module.get<ValidateFileUseCase>(ValidateFileUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should validate a valid video file', () => {
    const file = createMockFile();

    const result = useCase.validate(file, userId);

    expect(result).toBeDefined();
    expect(result.file_name).toBe('video.mp4');
    expect(result.extension).toBe('mp4');
    expect(result.size).toBe(file.size);
    expect(result.status).toBe(VideoStatus.PENDING);
    expect(result.userId).toBe(userId);
    expect(result.id).toBeDefined();
  });

  it('should throw error when file exceeds 30MB', () => {
    const file = createMockFile({ size: 31 * 1024 * 1024 });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
    expect(() => useCase.validate(file, userId)).toThrow('Arquivo excede o limite de 30MB');
  });

  it('should throw error for unsupported video format', () => {
    const file = createMockFile({ originalname: 'document.pdf', mimetype: 'application/pdf' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
    expect(() => useCase.validate(file, userId)).toThrow('Formato de vídeo não suportado');
  });

  it('should accept mp4 format', () => {
    const file = createMockFile({ originalname: 'video.mp4' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('mp4');
  });

  it('should accept avi format', () => {
    const file = createMockFile({ originalname: 'video.avi' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('avi');
  });

  it('should accept mov format', () => {
    const file = createMockFile({ originalname: 'video.mov' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('mov');
  });

  it('should accept mkv format', () => {
    const file = createMockFile({ originalname: 'video.mkv' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('mkv');
  });

  it('should accept wmv format', () => {
    const file = createMockFile({ originalname: 'video.wmv' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('wmv');
  });

  it('should accept flv format', () => {
    const file = createMockFile({ originalname: 'video.flv' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('flv');
  });

  it('should accept webm format', () => {
    const file = createMockFile({ originalname: 'video.webm' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('webm');
  });

  it('should reject txt format', () => {
    const file = createMockFile({ originalname: 'document.txt' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should reject jpg format', () => {
    const file = createMockFile({ originalname: 'image.jpg' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should accept exactly 30MB limit', () => {
    const file = createMockFile({ size: 30 * 1024 * 1024 });

    const result = useCase.validate(file, userId);

    expect(result).toBeDefined();
  });

  it('should handle file extension case sensitivity', () => {
    const file = createMockFile({ originalname: 'VIDEO.MP4' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should extract correct extension from filename with dots', () => {
    const file = createMockFile({ originalname: 'my.video.file.mp4' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('mp4');
  });

  it('should set createdAt and updatedAt to current date', () => {
    const file = createMockFile();
    const beforeValidation = new Date();

    const result = useCase.validate(file, userId);

    const afterValidation = new Date();

    expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeValidation.getTime());
    expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterValidation.getTime());
    expect(result.updatedAt).toEqual(result.createdAt);
  });

  it('should generate unique video ID on each validation', () => {
    const file1 = createMockFile();
    const file2 = createMockFile();

    const result1 = useCase.validate(file1, userId);
    const result2 = useCase.validate(file2, userId);

    expect(result1.id).not.toBe(result2.id);
  });

  it('should accept 1MB file', () => {
    const file = createMockFile({ size: 1024 * 1024 });

    const result = useCase.validate(file, userId);

    expect(result.size).toBe(1024 * 1024);
  });

  it('should accept 15MB file', () => {
    const file = createMockFile({ size: 15 * 1024 * 1024 });

    const result = useCase.validate(file, userId);

    expect(result.size).toBe(15 * 1024 * 1024);
  });

  it('should reject 30.1MB file', () => {
    const file = createMockFile({ size: 30.1 * 1024 * 1024 });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should reject 100MB file', () => {
    const file = createMockFile({ size: 100 * 1024 * 1024 });

    expect(() => useCase.validate(file, userId)).toThrow('Arquivo excede o limite de 30MB');
  });

  it('should handle very small files', () => {
    const file = createMockFile({ size: 100 }); // 100 bytes

    const result = useCase.validate(file, userId);

    expect(result.size).toBe(100);
  });

  it('should validate multiple files with different users', () => {
    const file1 = createMockFile();
    const file2 = createMockFile();
    const userId1 = 'user-111';
    const userId2 = 'user-222';

    const result1 = useCase.validate(file1, userId1);
    const result2 = useCase.validate(file2, userId2);

    expect(result1.userId).toBe(userId1);
    expect(result2.userId).toBe(userId2);
  });

  it('should maintain status as PENDING for all validations', () => {
    const file1 = createMockFile();
    const file2 = createMockFile();

    const result1 = useCase.validate(file1, userId);
    const result2 = useCase.validate(file2, userId);

    expect(result1.status).toBe(VideoStatus.PENDING);
    expect(result2.status).toBe(VideoStatus.PENDING);
  });

  it('should handle files with numbers in filename', () => {
    const file = createMockFile({ originalname: 'video123456.mp4' });

    const result = useCase.validate(file, userId);

    expect(result.file_name).toBe('video123456.mp4');
    expect(result.extension).toBe('mp4');
  });

  it('should handle files with hyphens in filename', () => {
    const file = createMockFile({ originalname: 'my-video-file.mp4' });

    const result = useCase.validate(file, userId);

    expect(result.file_name).toBe('my-video-file.mp4');
  });

  it('should handle files with underscores in filename', () => {
    const file = createMockFile({ originalname: 'my_video_file.mp4' });

    const result = useCase.validate(file, userId);

    expect(result.file_name).toBe('my_video_file.mp4');
  });

  it('should reject .gif format', () => {
    const file = createMockFile({ originalname: 'animation.gif' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should reject .png format', () => {
    const file = createMockFile({ originalname: 'image.png' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should reject .zip format', () => {
    const file = createMockFile({ originalname: 'archive.zip' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should reject .exe format', () => {
    const file = createMockFile({ originalname: 'program.exe' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should reject .bat format', () => {
    const file = createMockFile({ originalname: 'script.bat' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should process mp4 with video/mp4 MIME type', () => {
    const file = createMockFile({ mimetype: 'video/mp4' });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('mp4');
  });

  it('should process avi with video/x-msvideo MIME type', () => {
    const file = createMockFile({ 
      originalname: 'video.avi',
      mimetype: 'video/x-msvideo' 
    });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('avi');
  });

  it('should process mkv with video/x-matroska MIME type', () => {
    const file = createMockFile({ 
      originalname: 'video.mkv',
      mimetype: 'video/x-matroska' 
    });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('mkv');
  });

  it('should process webm with video/webm MIME type', () => {
    const file = createMockFile({ 
      originalname: 'video.webm',
      mimetype: 'video/webm' 
    });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('webm');
  });

  it('should create video object with all required fields', () => {
    const file = createMockFile();

    const result = useCase.validate(file, userId);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('file_name');
    expect(result).toHaveProperty('extension');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
  });

  it('should reject files with no extension', () => {
    const file = createMockFile({ originalname: 'videofile_no_extension' });

    expect(() => useCase.validate(file, userId)).toThrow(BadRequestException);
  });

  it('should handle different user ID formats', () => {
    const file = createMockFile();
    const numericUserId = '12345';
    const uuidUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const alphanumericUserId = 'user-abc-123';

    const result1 = useCase.validate(file, numericUserId);
    const result2 = useCase.validate(file, uuidUserId);
    const result3 = useCase.validate(file, alphanumericUserId);

    expect(result1.userId).toBe(numericUserId);
    expect(result2.userId).toBe(uuidUserId);
    expect(result3.userId).toBe(alphanumericUserId);
  });

  it('should handle consecutive validations', () => {
    const files = [
      createMockFile({ originalname: 'video1.mp4' }),
      createMockFile({ originalname: 'video2.avi' }),
      createMockFile({ originalname: 'video3.mkv' }),
    ];

    const results = files.map(f => useCase.validate(f, userId));

    expect(results).toHaveLength(3);
    expect(results[0].extension).toBe('mp4');
    expect(results[1].extension).toBe('avi');
    expect(results[2].extension).toBe('mkv');
  });

  it('should throw BadRequestException with specific message for oversized files', () => {
    const file = createMockFile({ size: 50 * 1024 * 1024 });

    try {
      useCase.validate(file, userId);
      fail('Should have thrown BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as any).message).toContain('30MB');
    }
  });

  it('should throw BadRequestException with specific message for unsupported format', () => {
    const file = createMockFile({ originalname: 'document.docx' });

    try {
      useCase.validate(file, userId);
      fail('Should have thrown BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as any).message).toContain('Formato');
    }
  });

  it('should preserve file size exactly', () => {
    const exactSize = 12345678;
    const file = createMockFile({ size: exactSize });

    const result = useCase.validate(file, userId);

    expect(result.size).toBe(exactSize);
  });

  it('should handle edge case: 1 byte file', () => {
    const file = createMockFile({ size: 1 });

    const result = useCase.validate(file, userId);

    expect(result.size).toBe(1);
  });

  it('should validate mov format with video/quicktime MIME type', () => {
    const file = createMockFile({ 
      originalname: 'video.mov',
      mimetype: 'video/quicktime' 
    });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('mov');
  });

  it('should validate flv format with video/x-flv MIME type', () => {
    const file = createMockFile({ 
      originalname: 'video.flv',
      mimetype: 'video/x-flv' 
    });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('flv');
  });

  it('should validate wmv format with video/x-ms-wmv MIME type', () => {
    const file = createMockFile({ 
      originalname: 'video.wmv',
      mimetype: 'video/x-ms-wmv' 
    });

    const result = useCase.validate(file, userId);

    expect(result.extension).toBe('wmv');
  });
});
