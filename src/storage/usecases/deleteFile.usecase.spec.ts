import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteFileUseCase } from './deleteFile.usecase';
import { StorageRepositoryInterface } from '../gateways/storage.repository.interface';

describe('DeleteFileUseCase', () => {
  let useCase: DeleteFileUseCase;
  let storageRepository: StorageRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteFileUseCase,
        {
          provide: 'StorageRepositoryInterface',
          useValue: {
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<DeleteFileUseCase>(DeleteFileUseCase);
    storageRepository = module.get<StorageRepositoryInterface>('StorageRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete file successfully', async () => {
    jest.spyOn(storageRepository, 'deleteFile').mockResolvedValue(true);

    const result = await useCase.execute('test-bucket', 'files/test-file.txt');

    expect(storageRepository.deleteFile).toHaveBeenCalledWith('test-bucket', 'files/test-file.txt');
    expect(result).toBe(true);
  });

  it('should throw NotFoundException when file does not exist', async () => {
    jest.spyOn(storageRepository, 'deleteFile').mockRejectedValue(
      new NotFoundException('File not found')
    );

    await expect(useCase.execute('test-bucket', 'non-existent-file.txt')).rejects.toThrow(
      NotFoundException
    );
    expect(storageRepository.deleteFile).toHaveBeenCalledWith('test-bucket', 'non-existent-file.txt');
  });
});
