import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetFileUseCase } from './getFile.usecase';
import { StorageRepositoryInterface } from '../gateways/storage.repository.interface';

describe('GetFileUseCase', () => {
  let useCase: GetFileUseCase;
  let storageRepository: StorageRepositoryInterface;

  const mockBuffer = Buffer.from('test file content');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFileUseCase,
        {
          provide: 'StorageRepositoryInterface',
          useValue: {
            getFile: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetFileUseCase>(GetFileUseCase);
    storageRepository = module.get<StorageRepositoryInterface>('StorageRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should retrieve file successfully', async () => {
    jest.spyOn(storageRepository, 'getFile').mockResolvedValue(mockBuffer);

    const result = await useCase.execute('test-bucket', 'files/test-file.txt');

    expect(storageRepository.getFile).toHaveBeenCalledWith('test-bucket', 'files/test-file.txt');
    expect(result).toEqual(mockBuffer);
  });

  it('should throw NotFoundException when file does not exist', async () => {
    jest.spyOn(storageRepository, 'getFile').mockRejectedValue(
      new NotFoundException('File not found')
    );

    await expect(useCase.execute('test-bucket', 'non-existent-file.txt')).rejects.toThrow(
      NotFoundException
    );
    expect(storageRepository.getFile).toHaveBeenCalledWith('test-bucket', 'non-existent-file.txt');
  });
});
