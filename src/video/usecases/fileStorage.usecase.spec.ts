import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { FileStorageUseCase } from './fileStorage.usecase';
import { UploadFileUseCase } from '../../storage/usecases/uploadFile.usecase';
import { GetFileUseCase } from '../../storage/usecases/getFile.usecase';
import { Video, VideoStatus } from '../domain/video.entity';
import { StorageFile } from '../../storage/domain/storage.entity';
import * as fs from 'fs';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue(Buffer.from('')),
    unlink: jest.fn().mockResolvedValue(undefined),
    rm: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('FileStorageUseCase', () => {
  let useCase: FileStorageUseCase;
  let uploadFileUseCase: UploadFileUseCase;
  let getFileUseCase: GetFileUseCase;

  const mockVideo: Video = {
    id: 'video-123',
    size: 5 * 1024 * 1024,
    file_name: 'test-video.mp4',
    extension: 'mp4',
    status: VideoStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-123',
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-video.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 5 * 1024 * 1024,
    destination: '/tmp',
    filename: 'test-video',
    path: '/tmp/test-video',
    buffer: Buffer.from('test content'),
  };

  const mockStorageFile: StorageFile = {
    bucket: 'athena-videos',
    key: 'user-123/video-123/test-video.mp4',
    url: 'https://s3.amazonaws.com/athena-videos/user-123/video-123/test-video.mp4',
    size: mockFile.size,
    uploadedAt: new Date(),
  };

  beforeEach(async () => {
    process.env.NODE_ENV = 'development';
    process.env.AWS_S3_BUCKET = 'athena-videos';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<FileStorageUseCase>(FileStorageUseCase);
    uploadFileUseCase = module.get<UploadFileUseCase>(UploadFileUseCase);
    getFileUseCase = module.get<GetFileUseCase>(GetFileUseCase);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.AWS_S3_BUCKET;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should store file locally in development environment', async () => {
    await useCase.storeFile(mockVideo, mockFile);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should store file to S3 in production environment', async () => {
    process.env.NODE_ENV = 'production';

    const moduleForProd: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockStorageFile),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    const useCase2 = moduleForProd.get<FileStorageUseCase>(FileStorageUseCase);
    const uploadFileUseCase2 = moduleForProd.get<UploadFileUseCase>(UploadFileUseCase);

    await useCase2.storeFile(mockVideo, mockFile);

    expect(uploadFileUseCase2.execute).toHaveBeenCalledWith(
      'athena-videos',
      `user-123/video-123/test-video.mp4`,
      mockFile.buffer,
      mockFile.mimetype
    );
  });

  it('should store buffer locally in development environment', async () => {
    const buffer = Buffer.from('test buffer content');
    const key = 'test-path/test-file.mp4';

    await useCase.storeBuffer(buffer, key, 'video/mp4');
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should store buffer to S3 in production environment', async () => {
    process.env.NODE_ENV = 'production';

    const moduleForProd: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockStorageFile),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    const useCase2 = moduleForProd.get<FileStorageUseCase>(FileStorageUseCase);
    const uploadFileUseCase2 = moduleForProd.get<UploadFileUseCase>(UploadFileUseCase);

    const buffer = Buffer.from('test buffer content');
    const key = 'test-path/test-frame.jpg';

    await useCase2.storeBuffer(buffer, key, 'image/jpeg');

    expect(uploadFileUseCase2.execute).toHaveBeenCalledWith(
      'athena-videos',
      key,
      buffer,
      'image/jpeg'
    );
  });

  it('should handle storeFile with different file types', async () => {
    const aviFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'test-video.avi',
      mimetype: 'video/x-msvideo',
      filename: 'test-video-avi',
    };

    await useCase.storeFile(mockVideo, aviFile);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle large files', async () => {
    const largeFile: Express.Multer.File = {
      ...mockFile,
      size: 100 * 1024 * 1024, // 100MB
    };

    await useCase.storeFile(mockVideo, largeFile);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle small files', async () => {
    const smallFile: Express.Multer.File = {
      ...mockFile,
      size: 1024, // 1KB
    };

    await useCase.storeFile(mockVideo, smallFile);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should construct correct S3 key path', async () => {
    process.env.NODE_ENV = 'production';

    const moduleForProd: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockStorageFile),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    const useCase2 = moduleForProd.get<FileStorageUseCase>(FileStorageUseCase);
    const uploadFileUseCase2 = moduleForProd.get<UploadFileUseCase>(UploadFileUseCase);

    const customVideo: Video = {
      ...mockVideo,
      id: 'custom-video-456',
      userId: 'user-789',
      file_name: 'custom-file.mkv',
      extension: 'mkv',
    };

    const customFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'custom-file.mkv',
      mimetype: 'video/x-matroska',
    };

    await useCase2.storeFile(customVideo, customFile);

    expect(uploadFileUseCase2.execute).toHaveBeenCalledWith(
      'athena-videos',
      `user-789/custom-video-456/custom-file.mkv`,
      customFile.buffer,
      customFile.mimetype
    );
  });

  it('should handle files with special characters in names', async () => {
    const specialFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'test-video-@#$%.mp4',
      filename: 'test-video-@#$%',
    };

    await useCase.storeFile(mockVideo, specialFile);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle videos with different statuses', async () => {
    const videoWithDifferentStatus: Video = {
      ...mockVideo,
      status: VideoStatus.PROCESSING,
    };

    await useCase.storeFile(videoWithDifferentStatus, mockFile);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should use correct bucket name from environment', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AWS_S3_BUCKET = 'custom-bucket-name';

    const moduleForProd: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockStorageFile),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    const useCase2 = moduleForProd.get<FileStorageUseCase>(FileStorageUseCase);
    const uploadFileUseCase2 = moduleForProd.get<UploadFileUseCase>(UploadFileUseCase);

    await useCase2.storeFile(mockVideo, mockFile);

    expect(uploadFileUseCase2.execute).toHaveBeenCalledWith(
      'custom-bucket-name',
      expect.any(String),
      mockFile.buffer,
      mockFile.mimetype
    );
  });

  it('should handle sequential file operations', async () => {
    const file1: Express.Multer.File = {
      ...mockFile,
      filename: 'file1',
    };

    const file2: Express.Multer.File = {
      ...mockFile,
      filename: 'file2',
    };

    await useCase.storeFile(mockVideo, file1);
    await useCase.storeFile(mockVideo, file2);

    expect(uploadFileUseCase.execute).toHaveBeenCalledTimes(0);
  });

  it('should handle buffer with different content types', async () => {
    const buffer1 = Buffer.from('image data');
    const buffer2 = Buffer.from('video data');

    await useCase.storeBuffer(buffer1, 'path/to/image.jpg', 'image/jpeg');
    await useCase.storeBuffer(buffer2, 'path/to/video.mp4', 'video/mp4');

    expect(uploadFileUseCase.execute).toHaveBeenCalledTimes(0);
  });

  it('should handle empty buffer', async () => {
    const emptyBuffer = Buffer.from('');

    await useCase.storeBuffer(emptyBuffer, 'path/to/empty.txt', 'text/plain');
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle multiple sequential buffer operations in production', async () => {
    process.env.NODE_ENV = 'production';

    const moduleForProd: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockStorageFile),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    const useCase2 = moduleForProd.get<FileStorageUseCase>(FileStorageUseCase);
    const uploadFileUseCase2 = moduleForProd.get<UploadFileUseCase>(UploadFileUseCase);

    const buffer = Buffer.from('test content');

    await useCase2.storeBuffer(buffer, 'path1/file.jpg', 'image/jpeg');
    await useCase2.storeBuffer(buffer, 'path2/file.jpg', 'image/jpeg');

    expect(uploadFileUseCase2.execute).toHaveBeenCalledTimes(2);
  });

  it('should handle videos with different user IDs', async () => {
    const video1: Video = { ...mockVideo, userId: 'user-111' };
    const video2: Video = { ...mockVideo, userId: 'user-222' };

    await useCase.storeFile(video1, mockFile);
    await useCase.storeFile(video2, mockFile);

    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle MKV video format in production', async () => {
    process.env.NODE_ENV = 'production';

    const moduleForProd: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockStorageFile),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    const useCase2 = moduleForProd.get<FileStorageUseCase>(FileStorageUseCase);
    const uploadFileUseCase2 = moduleForProd.get<UploadFileUseCase>(UploadFileUseCase);

    const mkvFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'movie.mkv',
      mimetype: 'video/x-matroska',
      filename: 'movie',
    };

    await useCase2.storeFile(mockVideo, mkvFile);

    expect(uploadFileUseCase2.execute).toHaveBeenCalledWith(
      'athena-videos',
      expect.stringContaining('movie.mkv'),
      mkvFile.buffer,
      'video/x-matroska'
    );
  });

  it('should handle WebM format in production', async () => {
    process.env.NODE_ENV = 'production';

    const moduleForProd: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageUseCase,
        {
          provide: UploadFileUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockStorageFile),
          },
        },
        {
          provide: GetFileUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    const useCase2 = moduleForProd.get<FileStorageUseCase>(FileStorageUseCase);
    const uploadFileUseCase2 = moduleForProd.get<UploadFileUseCase>(UploadFileUseCase);

    const webmFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'video.webm',
      mimetype: 'video/webm',
      filename: 'video-webm',
    };

    await useCase2.storeFile(mockVideo, webmFile);

    expect(uploadFileUseCase2.execute).toHaveBeenCalledWith(
      'athena-videos',
      expect.stringContaining('video.webm'),
      webmFile.buffer,
      'video/webm'
    );
  });

  it('should maintain file metadata during storage', async () => {
    const videoWithMetadata: Video = {
      ...mockVideo,
      size: 2147483648, // 2GB
      file_name: 'large-video.mp4',
      extension: 'mp4',
    };

    await useCase.storeFile(videoWithMetadata, mockFile);
    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle buffer storage with different MIME types', async () => {
    const buffer = Buffer.from('content');

    await useCase.storeBuffer(buffer, 'path/file.png', 'image/png');
    await useCase.storeBuffer(buffer, 'path/file.jpg', 'image/jpeg');
    await useCase.storeBuffer(buffer, 'path/file.gif', 'image/gif');

    expect(uploadFileUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle consecutive development mode file operations', async () => {
    process.env.NODE_ENV = 'development';

    const file1: Express.Multer.File = { ...mockFile, filename: 'file1' };
    const file2: Express.Multer.File = { ...mockFile, filename: 'file2' };
    const file3: Express.Multer.File = { ...mockFile, filename: 'file3' };

    await useCase.storeFile(mockVideo, file1);
    await useCase.storeFile(mockVideo, file2);
    await useCase.storeFile(mockVideo, file3);

    expect(uploadFileUseCase.execute).toHaveBeenCalledTimes(0);
  });
});