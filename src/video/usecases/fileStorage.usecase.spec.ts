import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { FileStorageUseCase } from './fileStorage.usecase';
import { UploadFileUseCase } from '../../storage/usecases/uploadFile.usecase';
import { GetFileUseCase } from '../../storage/usecases/getFile.usecase';
import { Video, VideoStatus } from '../domain/video.entity';
import { StorageFile } from '../../storage/domain/storage.entity';

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
});