import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateVideoDto, VideoStatus } from './create.dto';

describe('CreateVideoDto Validation', () => {
  it('should validate correct video DTO', async () => {
    const dto = plainToInstance(CreateVideoDto, {
      size: '5242880',
      file_name: 'video.mp4',
      extension: 'mp4',
      status: VideoStatus.PENDING,
      userId: 'user-123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when size is not provided', async () => {
    const dto = plainToInstance(CreateVideoDto, {
      file_name: 'video.mp4',
      userId: 'user-123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('size');
  });

  it('should fail when file_name is not provided', async () => {
    const dto = plainToInstance(CreateVideoDto, {
      size: '5242880',
      userId: 'user-123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('file_name');
  });

  it('should fail when userId is not provided', async () => {
    const dto = plainToInstance(CreateVideoDto, {
      size: '5242880',
      file_name: 'video.mp4',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should accept optional extension', async () => {
    const dto = plainToInstance(CreateVideoDto, {
      size: '5242880',
      file_name: 'video.mp4',
      userId: 'user-123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept optional status', async () => {
    const dto = plainToInstance(CreateVideoDto, {
      size: '5242880',
      file_name: 'video.mp4',
      userId: 'user-123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept all video statuses', async () => {
    const statuses = [VideoStatus.PENDING, VideoStatus.PROCESSING, VideoStatus.COMPLETED, VideoStatus.ERROR];

    for (const status of statuses) {
      const dto = plainToInstance(CreateVideoDto, {
        size: '5242880',
        file_name: 'video.mp4',
        status,
        userId: 'user-123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should fail when status is invalid', async () => {
    const dto = plainToInstance(CreateVideoDto, {
      size: '5242880',
      file_name: 'video.mp4',
      status: 'INVALID_STATUS',
      userId: 'user-123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });
});
