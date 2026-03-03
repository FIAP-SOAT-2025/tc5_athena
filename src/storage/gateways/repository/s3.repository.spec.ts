import { Test, TestingModule } from '@nestjs/testing';
import { S3Repository } from './s3.repository';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('S3Repository', () => {
  let repository: S3Repository;
  let mockS3Client: any;

  const mockBucket = 'test-bucket';
  const mockKey = 'test-file.txt';
  const mockBuffer = Buffer.from('test content');

  beforeEach(async () => {
    mockS3Client = {
      send: jest.fn(),
    };

    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Repository],
    }).compile();

    repository = module.get<S3Repository>(S3Repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file to S3', async () => {
      mockS3Client.send.mockResolvedValue({});

      const result = await repository.uploadFile(
        mockBucket,
        mockKey,
        mockBuffer,
        'text/plain'
      );

      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(result).toEqual({
        bucket: mockBucket,
        key: mockKey,
        contentType: 'text/plain',
        size: mockBuffer.length,
      });
    });

    it('should upload file without content type', async () => {
      mockS3Client.send.mockResolvedValue({});

      const result = await repository.uploadFile(mockBucket, mockKey, mockBuffer);

      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(result).toEqual({
        bucket: mockBucket,
        key: mockKey,
        contentType: undefined,
        size: mockBuffer.length,
      });
    });

    it('should throw error when upload fails', async () => {
      mockS3Client.send.mockRejectedValue(new Error('Upload failed'));

      await expect(
        repository.uploadFile(mockBucket, mockKey, mockBuffer)
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      mockS3Client.send.mockResolvedValue({});

      await repository.deleteFile(mockBucket, mockKey);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand)
      );
    });

    it('should throw error when delete fails', async () => {
      mockS3Client.send.mockRejectedValue(new Error('Delete failed'));

      await expect(repository.deleteFile(mockBucket, mockKey)).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('getFile', () => {
    it('should get file from S3', async () => {
      const mockResponse = {
        Body: {
          transformToByteArray: jest
            .fn()
            .mockResolvedValue(new Uint8Array(mockBuffer)),
        },
        ContentType: 'text/plain',
        ContentLength: mockBuffer.length,
      };

      mockS3Client.send.mockResolvedValue(mockResponse);

      const result = await repository.getFile(mockBucket, mockKey);

      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
      expect(result).toEqual({
        bucket: mockBucket,
        key: mockKey,
        contentType: 'text/plain',
        size: mockBuffer.length,
        body: expect.any(Buffer),
      });
    });

    it('should throw error when file not found', async () => {
      mockS3Client.send.mockRejectedValue(new Error('File not found'));

      await expect(repository.getFile(mockBucket, mockKey)).rejects.toThrow(
        'File not found'
      );
    });

    it('should handle file with no content type', async () => {
      const mockResponse = {
        Body: {
          transformToByteArray: jest
            .fn()
            .mockResolvedValue(new Uint8Array(mockBuffer)),
        },
        ContentLength: mockBuffer.length,
      };

      mockS3Client.send.mockResolvedValue(mockResponse);

      const result = await repository.getFile(mockBucket, mockKey);

      expect(result.contentType).toBeUndefined();
    });
  });
});
