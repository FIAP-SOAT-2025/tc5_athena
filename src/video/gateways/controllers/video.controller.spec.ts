import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoProcessorUseCase } from '../../usecases/videoProcessor.usecase';
import { FileStorageUseCase } from '../../usecases/fileStorage.usecase';
import { ValidateFileUseCase } from '../../usecases/validateFile.usecase';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Video, VideoStatus } from '../../domain/video.entity';
import { getQueueToken } from '@nestjs/bullmq';

describe('VideoController', () => {
  let controller: VideoController;
  let videoProcessorUseCase: VideoProcessorUseCase;
  let fileStorageUseCase: FileStorageUseCase;
  let validateFileUseCase: ValidateFileUseCase;
  let videoQueue: Queue;

  const mockUser = { userId: 'user-123', email: 'test@example.com' };

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

  const mockVideo: Video = {
    id: 'video-123',
    size: mockFile.size,
    file_name: mockFile.originalname,
    extension: 'mp4',
    status: VideoStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: mockUser.userId,
  };

  const mockProcessResult = {
    jobId: 'job-123',
    videoId: mockVideo.id,
    status: 'queued',
  };

  const mockJob = {
    id: 'job-123',
    progress: 0,
    returnvalue: null,
    failedReason: null,
    getState: jest.fn().mockResolvedValue('waiting'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        {
          provide: VideoProcessorUseCase,
          useValue: {
            process: jest.fn(),
          },
        },
        {
          provide: FileStorageUseCase,
          useValue: {
            storeFile: jest.fn(),
          },
        },
        {
          provide: ValidateFileUseCase,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('output.zip'),
          },
        },
        {
          provide: getQueueToken('video-processing'),
          useValue: {
            getJob: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
    videoProcessorUseCase = module.get<VideoProcessorUseCase>(VideoProcessorUseCase);
    fileStorageUseCase = module.get<FileStorageUseCase>(FileStorageUseCase);
    validateFileUseCase = module.get<ValidateFileUseCase>(ValidateFileUseCase);
    videoQueue = module.get<Queue>(getQueueToken('video-processing'));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadVideo', () => {
    it('should upload video successfully', async () => {
      jest.spyOn(validateFileUseCase, 'validate').mockReturnValue(mockVideo);
      jest.spyOn(fileStorageUseCase, 'storeFile').mockResolvedValue(undefined);
      jest.spyOn(videoProcessorUseCase, 'process').mockResolvedValue(mockProcessResult);

      const req = { user: mockUser } as any;

      const result = await controller.uploadVideo(mockFile, req);

      expect(validateFileUseCase.validate).toHaveBeenCalledWith(mockFile, mockUser.userId);
      expect(fileStorageUseCase.storeFile).toHaveBeenCalledWith(mockVideo, mockFile);
      expect(videoProcessorUseCase.process).toHaveBeenCalledWith(mockVideo);
      expect(result).toEqual(mockProcessResult);
    });

    it('should throw BadRequestException when file validation fails', async () => {
      jest.spyOn(validateFileUseCase, 'validate').mockImplementation(() => {
        throw new Error('Arquivo excede o limite de 30MB');
      });

      const req = { user: mockUser } as any;

      await expect(controller.uploadVideo(mockFile, req)).rejects.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return job status', async () => {
      jest.spyOn(videoQueue, 'getJob').mockResolvedValue(mockJob as any);

      const result = await controller.getStatus('job-123');

      expect(videoQueue.getJob).toHaveBeenCalledWith('job-123');
      expect(result).toEqual({
        id: 'job-123',
        state: 'waiting',
        progress: '0%',
        result: null,
        error: null,
      });
    });

    it('should throw NotFoundException when job does not exist', async () => {
      jest.spyOn(videoQueue, 'getJob').mockResolvedValue(null);

      await expect(controller.getStatus('non-existent-job')).rejects.toThrow(NotFoundException);
      expect(videoQueue.getJob).toHaveBeenCalledWith('non-existent-job');
    });

    it('should return result when job is completed', async () => {
      const completedJob = {
        ...mockJob,
        returnvalue: { outputPath: '/output/output.zip' },
        getState: jest.fn().mockResolvedValue('completed'),
      };

      jest.spyOn(videoQueue, 'getJob').mockResolvedValue(completedJob as any);

      const result = await controller.getStatus('completed-job');

      expect(result).toEqual({
        id: 'job-123',
        state: 'completed',
        progress: '0%',
        result: { outputPath: '/output/output.zip' },
        error: null,
      });
    });

    it('should return error when job has failed', async () => {
      const failedJob = {
        ...mockJob,
        failedReason: 'Processing error',
        getState: jest.fn().mockResolvedValue('failed'),
      };

      jest.spyOn(videoQueue, 'getJob').mockResolvedValue(failedJob as any);

      const result = await controller.getStatus('failed-job');

      expect(result).toEqual({
        id: 'job-123',
        state: 'failed',
        progress: '0%',
        result: null,
        error: 'Processing error',
      });
    });
  });
});
