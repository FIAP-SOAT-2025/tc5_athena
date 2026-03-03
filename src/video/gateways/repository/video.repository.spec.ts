import { Test, TestingModule } from '@nestjs/testing';
import { PrismaVideoRepository } from './video.repository';
import { dbConection } from '../../../database/dbConection';
import { Video, VideoStatus } from '../../domain/video.entity';

describe('PrismaVideoRepository', () => {
  let repository: PrismaVideoRepository;
  let mockPrisma: any;

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

  beforeEach(async () => {
    mockPrisma = {
      video: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaVideoRepository,
        {
          provide: dbConection,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<PrismaVideoRepository>(PrismaVideoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new video', async () => {
      mockPrisma.video.create.mockResolvedValue(mockVideo);

      const result = await repository.create(mockVideo);

      expect(mockPrisma.video.create).toHaveBeenCalledWith({
        data: {
          id: mockVideo.id,
          size: mockVideo.size,
          file_name: mockVideo.file_name,
          extension: mockVideo.extension,
          status: mockVideo.status,
          createdAt: mockVideo.createdAt,
          updatedAt: mockVideo.updatedAt,
          userId: mockVideo.userId,
        },
      });
      expect(result).toEqual(mockVideo);
    });
  });

  describe('findById', () => {
    it('should find video by id', async () => {
      mockPrisma.video.findUnique.mockResolvedValue(mockVideo);

      const result = await repository.findById(mockVideo.id);

      expect(mockPrisma.video.findUnique).toHaveBeenCalledWith({
        where: { id: mockVideo.id },
      });
      expect(result).toEqual(mockVideo);
    });

    it('should return null when video not found', async () => {
      mockPrisma.video.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all videos by user id', async () => {
      const mockVideos = [mockVideo, { ...mockVideo, id: 'video-124' }];
      mockPrisma.video.findMany.mockResolvedValue(mockVideos);

      const result = await repository.findByUserId(mockVideo.userId);

      expect(mockPrisma.video.findMany).toHaveBeenCalledWith({
        where: { userId: mockVideo.userId },
      });
      expect(result).toEqual(mockVideos);
    });

    it('should return empty array when user has no videos', async () => {
      mockPrisma.video.findMany.mockResolvedValue([]);

      const result = await repository.findByUserId('user-with-no-videos');

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update video status', async () => {
      const updatedVideo = {
        ...mockVideo,
        status: VideoStatus.PROCESSING,
        updatedAt: new Date(),
      };
      mockPrisma.video.update.mockResolvedValue(updatedVideo);

      const result = await repository.updateStatus(
        mockVideo.id,
        VideoStatus.PROCESSING
      );

      expect(mockPrisma.video.update).toHaveBeenCalledWith({
        where: { id: mockVideo.id },
        data: {
          status: VideoStatus.PROCESSING,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedVideo);
    });

    it('should update status to COMPLETED', async () => {
      const completedVideo = {
        ...mockVideo,
        status: VideoStatus.COMPLETED,
        updatedAt: new Date(),
      };
      mockPrisma.video.update.mockResolvedValue(completedVideo);

      const result = await repository.updateStatus(
        mockVideo.id,
        VideoStatus.COMPLETED
      );

      expect(result.status).toBe(VideoStatus.COMPLETED);
    });

    it('should update status to ERROR', async () => {
      const errorVideo = {
        ...mockVideo,
        status: VideoStatus.ERROR,
        updatedAt: new Date(),
      };
      mockPrisma.video.update.mockResolvedValue(errorVideo);

      const result = await repository.updateStatus(
        mockVideo.id,
        VideoStatus.ERROR
      );

      expect(result.status).toBe(VideoStatus.ERROR);
    });
  });
});
