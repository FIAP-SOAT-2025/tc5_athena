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

  it('should process video with different formats', async () => {
    const aviVideo: Video = { ...mockVideo, extension: 'avi', file_name: 'video.avi' };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(aviVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    const result = await useCase.process(aviVideo);

    expect(result.videoId).toBe(aviVideo.id);
    expect(videoQueue.add).toHaveBeenCalled();
  });

  it('should process large video files', async () => {
    const largeVideo: Video = { ...mockVideo, size: 10 * 1024 * 1024 * 1024 };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(largeVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(largeVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(largeVideo);
  });

  it('should queue job with correct parameters', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(mockVideo);

    const callArgs = (videoQueue.add as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toBe('extract-frames');
    expect(callArgs[1].videoId).toBe(mockVideo.id);
    expect(callArgs[1].userId).toBe(mockVideo.userId);
  });

  it('should handle videos with special characters in filename', async () => {
    const specialVideo: Video = { ...mockVideo, file_name: 'video-@#$%.mp4' };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(specialVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(specialVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(specialVideo);
  });

  it('should handle multiple video processing requests sequentially', async () => {
    const video1: Video = { ...mockVideo, id: 'video-1' };
    const video2: Video = { ...mockVideo, id: 'video-2' };

    jest.spyOn(videoRepository, 'create').mockResolvedValueOnce(video1);
    jest.spyOn(videoQueue, 'add').mockResolvedValueOnce(mockJob as any);

    jest.spyOn(videoRepository, 'create').mockResolvedValueOnce(video2);
    jest.spyOn(videoQueue, 'add').mockResolvedValueOnce(mockJob as any);

    await useCase.process(video1);
    await useCase.process(video2);

    expect(videoRepository.create).toHaveBeenCalledTimes(2);
    expect(videoQueue.add).toHaveBeenCalledTimes(2);
  });

  it('should set correct retry policy for queue job', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(mockVideo);

    const jobOptions = (videoQueue.add as jest.Mock).mock.calls[0][2];
    expect(jobOptions.attempts).toBe(3);
    expect(jobOptions.backoff.type).toBe('exponential');
  });

  it('should handle PENDING status videos', async () => {
    const pendingVideo: Video = { ...mockVideo, status: VideoStatus.PENDING };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(pendingVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(pendingVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(pendingVideo);
  });

  it('should handle PROCESSING status videos', async () => {
    const processingVideo: Video = { ...mockVideo, status: VideoStatus.PROCESSING };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(processingVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(processingVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(processingVideo);
  });

  it('should handle COMPLETED status videos', async () => {
    const completedVideo: Video = { ...mockVideo, status: VideoStatus.COMPLETED };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(completedVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(completedVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(completedVideo);
  });

  it('should handle FAILED status videos', async () => {
    const failedVideo: Video = { ...mockVideo, status: VideoStatus.FAILED };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(failedVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(failedVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(failedVideo);
  });

  it('should return job ID from process method', async () => {
    const jobWithId = { id: 'custom-job-456' };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(jobWithId as any);

    const result = await useCase.process(mockVideo);

    expect(result.jobId).toBe('custom-job-456');
  });

  it('should return Processing status from process method', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    const result = await useCase.process(mockVideo);

    expect(result.status).toBe('Processing');
  });

  it('should handle 4K video resolution', async () => {
    const video4k: Video = { ...mockVideo, size: 20 * 1024 * 1024 * 1024 };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(video4k);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(video4k);

    expect(videoQueue.add).toHaveBeenCalled();
  });

  it('should handle videos with very long filenames', async () => {
    const longNameVideo: Video = {
      ...mockVideo,
      file_name: 'a'.repeat(200) + '.mp4'
    };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(longNameVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(longNameVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(longNameVideo);
  });

  it('should preserve video metadata during processing', async () => {
    const videoWithMetadata: Video = {
      ...mockVideo,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(videoWithMetadata);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(videoWithMetadata);

    expect(videoRepository.create).toHaveBeenCalledWith(videoWithMetadata);
  });

  it('should include original filename in queue job data', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(mockVideo);

    const jobData = (videoQueue.add as jest.Mock).mock.calls[0][1];
    expect(jobData.originalName).toBe(mockVideo.file_name);
  });

  it('should include timestamp in queue job data', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(mockVideo);

    const jobData = (videoQueue.add as jest.Mock).mock.calls[0][1];
    expect(jobData.timestamp).toBeDefined();
    expect(typeof jobData.timestamp).toBe('number');
  });

  it('should create video in repository with all fields', async () => {
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mockVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(mockVideo);

    expect(videoRepository.create).toHaveBeenCalledWith({
      id: mockVideo.id,
      size: mockVideo.size,
      file_name: mockVideo.file_name,
      extension: mockVideo.extension,
      status: mockVideo.status,
      createdAt: mockVideo.createdAt,
      updatedAt: mockVideo.updatedAt,
      userId: mockVideo.userId,
    });
  });

  it('should handle different user IDs', async () => {
    const video1: Video = { ...mockVideo, userId: 'user-100' };
    const video2: Video = { ...mockVideo, userId: 'user-200', id: 'video-200' };

    jest.spyOn(videoRepository, 'create').mockResolvedValueOnce(video1);
    jest.spyOn(videoQueue, 'add').mockResolvedValueOnce(mockJob as any);

    jest.spyOn(videoRepository, 'create').mockResolvedValueOnce(video2);
    jest.spyOn(videoQueue, 'add').mockResolvedValueOnce(mockJob as any);

    await useCase.process(video1);
    await useCase.process(video2);

    const firstCallData = (videoQueue.add as jest.Mock).mock.calls[0][1];
    const secondCallData = (videoQueue.add as jest.Mock).mock.calls[1][1];

    expect(firstCallData.userId).toBe('user-100');
    expect(secondCallData.userId).toBe('user-200');
  });

  it('should handle MKV extension', async () => {
    const mkvVideo: Video = { ...mockVideo, extension: 'mkv', file_name: 'video.mkv' };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(mkvVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(mkvVideo);

    const jobData = (videoQueue.add as jest.Mock).mock.calls[0][1];
    expect(jobData.originalName).toBe('video.mkv');
  });

  it('should handle WebM extension', async () => {
    const webmVideo: Video = { ...mockVideo, extension: 'webm', file_name: 'video.webm' };
    jest.spyOn(videoRepository, 'create').mockResolvedValue(webmVideo);
    jest.spyOn(videoQueue, 'add').mockResolvedValue(mockJob as any);

    await useCase.process(webmVideo);

    expect(videoRepository.create).toHaveBeenCalledWith(webmVideo);
  });
});
