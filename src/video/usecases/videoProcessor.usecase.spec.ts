import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VideoProcessorUseCase } from './videoProcessor.usecase';
import { PrismaVideoRepository } from '../gateways/repository/video.repository';
import { Video, VideoStatus } from '../domain/video.entity';

describe('VideoProcessorUseCase', () => {
  let useCase: VideoProcessorUseCase;
  let videoQueue: Queue;
  let videoRepository: PrismaVideoRepository;

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

  const mockJob = {
    id: 'job-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoProcessorUseCase,
        {
          provide: getQueueToken('video-processing'),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: PrismaVideoRepository,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<VideoProcessorUseCase>(VideoProcessorUseCase);
    videoQueue = module.get<Queue>(getQueueToken('video-processing'));
    videoRepository = module.get<PrismaVideoRepository>(PrismaVideoRepository);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should process video and queue job', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    const result = await useCase.process(mockVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(mockVideo);
    expect(videoQueue.add).toHaveBeenCalledWith(
      'extract-frames',
      {
        videoId: mockVideo.id,
        userId: mockVideo.userId,
        originalName: mockVideo.file_name,
        timestamp: expect.any(Number),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }
    );
    expect(result).toEqual({
      jobId: 'job-123',
      status: 'Processing',
      videoId: mockVideo.id,
    });
  });

  it('should handle repository errors', async () => {
    jest.spyOn(videoRepository, 'create').mockRejectedValue(new Error('Database error'));

    await expect(useCase.process(mockVideo)).rejects.toThrow('Database error');
    expect(videoQueue.add).not.toHaveBeenCalled();
  });

  it('should handle queue errors', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockRejectedValue(new Error('Queue error'));

    await expect(useCase.process(mockVideo)).rejects.toThrow('Queue error');
  });
});
