import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { VideoProcessorUseCase } from '../../usecases/videoProcessor.usecase';
import { FileStorageUseCase } from '../../usecases/fileStorage.usecase';
import { ValidateFileUseCase } from '../../usecases/validateFile.usecase';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

describe('VideoController - Extended Tests', () => {
  let controller: VideoController;
  let videoProcessorUseCase: jest.Mocked<VideoProcessorUseCase>;
  let fileStorageUseCase: jest.Mocked<FileStorageUseCase>;
  let validateFileUseCase: jest.Mocked<ValidateFileUseCase>;
  let videoQueue: jest.Mocked<Queue>;

  const mockUser = { userId: 'user-123', email: 'test@example.com' };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 5 * 1024 * 1024,
    destination: '/tmp',
    filename: 'test',
    path: '/tmp/test',
    buffer: Buffer.from('test'),
  };

  const mockVideo = {
    id: 'video-id',
    size: mockFile.size,
    file_name: mockFile.originalname,
    extension: 'mp4',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: mockUser.userId,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        {
          provide: VideoProcessorUseCase,
          useValue: { process: jest.fn() },
        },
        {
          provide: FileStorageUseCase,
          useValue: { storeFile: jest.fn() },
        },
        {
          provide: ValidateFileUseCase,
          useValue: { validate: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('output.zip') },
        },
        {
          provide: getQueueToken('video-processing'),
          useValue: { getJob: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
    videoProcessorUseCase = module.get(VideoProcessorUseCase);
    fileStorageUseCase = module.get(FileStorageUseCase);
    validateFileUseCase = module.get(ValidateFileUseCase);
    videoQueue = module.get(getQueueToken('video-processing'));
  });

  it('should validate file before upload', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue({
      jobId: 'job-1',
      status: 'Processing',
      videoId: mockVideo.id,
    });

    const req = { user: mockUser } as any;
    await controller.uploadVideo(mockFile, req);

    expect(validateFileUseCase.validate).toHaveBeenCalledWith(mockFile, mockUser.userId);
  });

  it('should store file after validation', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue({
      jobId: 'job-1',
      status: 'Processing',
      videoId: mockVideo.id,
    });

    const req = { user: mockUser } as any;
    await controller.uploadVideo(mockFile, req);

    expect(fileStorageUseCase.storeFile).toHaveBeenCalledWith(mockVideo, mockFile);
  });

  it('should process video after storage', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue({
      jobId: 'job-1',
      status: 'Processing',
      videoId: mockVideo.id,
    });

    const req = { user: mockUser } as any;
    await controller.uploadVideo(mockFile, req);

    expect(videoProcessorUseCase.process).toHaveBeenCalledWith(mockVideo);
  });

  it('should return jobId when upload successful', async () => {
    const expectedResult = { jobId: 'job-1', status: 'Processing', videoId: mockVideo.id };
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(expectedResult);

    const req = { user: mockUser } as any;
    const result = await controller.uploadVideo(mockFile, req);

    expect(result).toEqual(expectedResult);
    expect(result.jobId).toBeDefined();
    expect(result.status).toBe('Processing');
  });

  it('should handle AVI video format', async () => {
    const aviFile: Express.Multer.File = { ...mockFile, originalname: 'video.avi', mimetype: 'video/x-msvideo' };
    const aviVideo = { ...mockVideo, file_name: 'video.avi', extension: 'avi' };
    const result = { jobId: 'job-2', status: 'Processing', videoId: aviVideo.id };

    validateFileUseCase.validate.mockReturnValue(aviVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(aviFile, req);

    expect(response.jobId).toBe('job-2');
  });

  it('should handle MKV video format', async () => {
    const mkvFile: Express.Multer.File = { ...mockFile, originalname: 'video.mkv', mimetype: 'video/x-matroska' };
    const mkvVideo = { ...mockVideo, file_name: 'video.mkv', extension: 'mkv' };
    const result = { jobId: 'job-3', status: 'Processing', videoId: mkvVideo.id };

    validateFileUseCase.validate.mockReturnValue(mkvVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(mkvFile, req);

    expect(response.jobId).toBe('job-3');
  });

  it('should handle WebM video format', async () => {
    const webmFile: Express.Multer.File = { ...mockFile, originalname: 'video.webm', mimetype: 'video/webm' };
    const webmVideo = { ...mockVideo, file_name: 'video.webm', extension: 'webm' };
    const result = { jobId: 'job-4', status: 'Processing', videoId: webmVideo.id };

    validateFileUseCase.validate.mockReturnValue(webmVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(webmFile, req);

    expect(response.jobId).toBe('job-4');
  });

  it('should handle large video files', async () => {
    const largeFile: Express.Multer.File = { ...mockFile, size: 100 * 1024 * 1024 };
    const largeVideo = { ...mockVideo, size: 100 * 1024 * 1024 };
    const result = { jobId: 'job-5', status: 'Processing', videoId: largeVideo.id };

    validateFileUseCase.validate.mockReturnValue(largeVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(largeFile, req);

    expect(response.status).toBe('Processing');
  });

  it('should handle small video files', async () => {
    const smallFile: Express.Multer.File = { ...mockFile, size: 1024 };
    const smallVideo = { ...mockVideo, size: 1024 };
    const result = { jobId: 'job-6', status: 'Processing', videoId: smallVideo.id };

    validateFileUseCase.validate.mockReturnValue(smallVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(smallFile, req);

    expect(response.videoId).toBe(smallVideo.id);
  });

  it('should call usecases in correct order', async () => {
    const callOrder: string[] = [];

    validateFileUseCase.validate.mockImplementation(() => {
      callOrder.push('validate');
      return mockVideo as any;
    });

    fileStorageUseCase.storeFile.mockImplementation(async () => {
      callOrder.push('storeFile');
    });

    videoProcessorUseCase.process.mockImplementation(async () => {
      callOrder.push('process');
      return { jobId: 'job-1', status: 'Processing', videoId: mockVideo.id };
    });

    const req = { user: mockUser } as any;
    await controller.uploadVideo(mockFile, req);

    expect(callOrder[0]).toBe('validate');
    expect(callOrder[1]).toBe('storeFile');
    expect(callOrder[2]).toBe('process');
  });

  it('should handle multiple sequential uploads', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);

    const results = [
      { jobId: 'job-1', status: 'Processing', videoId: 'video-1' },
      { jobId: 'job-2', status: 'Processing', videoId: 'video-2' },
      { jobId: 'job-3', status: 'Processing', videoId: 'video-3' },
    ];

    results.forEach((result, index) => {
      videoProcessorUseCase.process.mockResolvedValueOnce(result);
    });

    const req = { user: mockUser } as any;
    const file1 = { ...mockFile, originalname: 'video1.mp4' };
    const file2 = { ...mockFile, originalname: 'video2.mp4' };
    const file3 = { ...mockFile, originalname: 'video3.mp4' };

    const response1 = await controller.uploadVideo(file1, req);
    const response2 = await controller.uploadVideo(file2, req);
    const response3 = await controller.uploadVideo(file3, req);

    expect(response1.jobId).toBe('job-1');
    expect(response2.jobId).toBe('job-2');
    expect(response3.jobId).toBe('job-3');
    expect(videoProcessorUseCase.process).toHaveBeenCalledTimes(3);
  });

  it('should handle files with special characters in name', async () => {
    const specialFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'video-@#$%.mp4',
    };
    const specialVideo = { ...mockVideo, file_name: 'video-@#$%.mp4' };
    const result = { jobId: 'job-7', status: 'Processing', videoId: specialVideo.id };

    validateFileUseCase.validate.mockReturnValue(specialVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(specialFile, req);

    expect(response.jobId).toBeDefined();
  });

  it('should preserve user ID in video object', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue({
      jobId: 'job-1',
      status: 'Processing',
      videoId: mockVideo.id,
    });

    const req = { user: { userId: 'specific-user-id', email: 'specific@test.com' } } as any;
    await controller.uploadVideo(mockFile, req);

    expect(validateFileUseCase.validate).toHaveBeenCalledWith(
      mockFile,
      'specific-user-id'
    );
  });

  it('should validate file with correct user context', async () => {
    const differentUser = { userId: 'user-999', email: 'other@example.com' };
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue({
      jobId: 'job-1',
      status: 'Processing',
      videoId: mockVideo.id,
    });

    const req = { user: differentUser } as any;
    await controller.uploadVideo(mockFile, req);

    expect(validateFileUseCase.validate).toHaveBeenCalledWith(mockFile, differentUser.userId);
  });

  it('should handle response with all required properties', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    const expectedResult = { jobId: 'job-123', status: 'Processing', videoId: 'video-456' };
    videoProcessorUseCase.process.mockResolvedValue(expectedResult);

    const req = { user: mockUser } as any;
    const result = await controller.uploadVideo(mockFile, req);

    expect(result).toHaveProperty('jobId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('videoId');
  });

  it('should handle MOV video format', async () => {
    const movFile: Express.Multer.File = { ...mockFile, originalname: 'video.mov', mimetype: 'video/quicktime' };
    const movVideo = { ...mockVideo, file_name: 'video.mov', extension: 'mov' };
    const result = { jobId: 'job-8', status: 'Processing', videoId: movVideo.id };

    validateFileUseCase.validate.mockReturnValue(movVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(movFile, req);

    expect(response.status).toBe('Processing');
  });

  it('should handle FLV video format', async () => {
    const flvFile: Express.Multer.File = { ...mockFile, originalname: 'video.flv', mimetype: 'video/x-flv' };
    const flvVideo = { ...mockVideo, file_name: 'video.flv', extension: 'flv' };
    const result = { jobId: 'job-9', status: 'Processing', videoId: flvVideo.id };

    validateFileUseCase.validate.mockReturnValue(flvVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(flvFile, req);

    expect(response.jobId).toBe('job-9');
  });

  it('should handle WMV video format', async () => {
    const wmvFile: Express.Multer.File = { ...mockFile, originalname: 'video.wmv', mimetype: 'video/x-ms-wmv' };
    const wmvVideo = { ...mockVideo, file_name: 'video.wmv', extension: 'wmv' };
    const result = { jobId: 'job-10', status: 'Processing', videoId: wmvVideo.id };

    validateFileUseCase.validate.mockReturnValue(wmvVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue(result);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(wmvFile, req);

    expect(response.videoId).toBe(wmvVideo.id);
  });

  it('should pass entire file object to validate', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);
    videoProcessorUseCase.process.mockResolvedValue({
      jobId: 'job-1',
      status: 'Processing',
      videoId: mockVideo.id,
    });

    const customFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'custom.mp4',
      size: 12345,
    };

    const req = { user: mockUser } as any;
    await controller.uploadVideo(customFile, req);

    const validateCall = validateFileUseCase.validate.mock.calls[0];
    expect(validateCall[0]).toEqual(customFile);
  });

  it('should handle response mapping correctly', async () => {
    validateFileUseCase.validate.mockReturnValue(mockVideo as any);
    fileStorageUseCase.storeFile.mockResolvedValue(undefined);

    const processingResult = {
      jobId: 'unique-job-id-xyz',
      status: 'Processing',
      videoId: 'unique-video-id-abc',
    };
    videoProcessorUseCase.process.mockResolvedValue(processingResult);

    const req = { user: mockUser } as any;
    const response = await controller.uploadVideo(mockFile, req);

    expect(response.jobId).toBe('unique-job-id-xyz');
    expect(response.videoId).toBe('unique-video-id-abc');
  });

  it('should call validate before storeFile', async () => {
    const executionOrder: string[] = [];

    validateFileUseCase.validate.mockImplementation(() => {
      executionOrder.push('validate');
      return mockVideo as any;
    });

    fileStorageUseCase.storeFile.mockImplementation(async () => {
      executionOrder.push('storeFile');
    });

    videoProcessorUseCase.process.mockImplementation(async () => {
      return { jobId: 'job-1', status: 'Processing', videoId: mockVideo.id };
    });

    const req = { user: mockUser } as any;
    await controller.uploadVideo(mockFile, req);

    expect(executionOrder.indexOf('validate')).toBeLessThan(
      executionOrder.indexOf('storeFile')
    );
  });

  it('should call storeFile before process', async () => {
    const executionOrder: string[] = [];

    validateFileUseCase.validate.mockReturnValue(mockVideo as any);

    fileStorageUseCase.storeFile.mockImplementation(async () => {
      executionOrder.push('storeFile');
    });

    videoProcessorUseCase.process.mockImplementation(async () => {
      executionOrder.push('process');
      return { jobId: 'job-1', status: 'Processing', videoId: mockVideo.id };
    });

    const req = { user: mockUser } as any;
    await controller.uploadVideo(mockFile, req);

    expect(executionOrder.indexOf('storeFile')).toBeLessThan(
      executionOrder.indexOf('process')
    );
  });
});
