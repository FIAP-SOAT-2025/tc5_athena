import { Test, TestingModule } from '@nestjs/testing';
import { UploadFileUseCase } from './uploadFile.usecase';
import { StorageRepositoryInterface } from '../gateways/storage.repository.interface';
import { StorageFile } from '../domain/storage.entity';

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;
  let storageRepository: StorageRepositoryInterface;

  const mockStorageFile: StorageFile = {
    bucket: 'test-bucket',
    key: 'files/test-file.txt',
    url: 'https://s3.amazonaws.com/test-bucket/files/test-file.txt',
    size: 1024,
    uploadedAt: new Date(),
  };

  const mockBuffer = Buffer.from('test file content');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadFileUseCase,
        {
          provide: 'StorageRepositoryInterface',
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UploadFileUseCase>(UploadFileUseCase);
    storageRepository = module.get<StorageRepositoryInterface>('StorageRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should upload file successfully', async () => {
    jest.spyOn(storageRepository, 'uploadFile').mockResolvedValue(mockStorageFile);

    const result = await useCase.execute(
      'test-bucket',
      'files/test-file.txt',
      mockBuffer,
      'text/plain'
    );

    expect(storageRepository.uploadFile).toHaveBeenCalledWith(
      'test-bucket',
      'files/test-file.txt',
      mockBuffer,
      'text/plain'
    );
    expect(result).toEqual(mockStorageFile);
  });

  it('should upload file without content type', async () => {
    jest.spyOn(storageRepository, 'uploadFile').mockResolvedValue(mockStorageFile);

    const result = await useCase.execute(
      'test-bucket',
      'files/test-file.txt',
      mockBuffer
    );

    expect(storageRepository.uploadFile).toHaveBeenCalledWith(
      'test-bucket',
      'files/test-file.txt',
      mockBuffer,
      undefined
    );
    expect(result).toEqual(mockStorageFile);
  });
});
