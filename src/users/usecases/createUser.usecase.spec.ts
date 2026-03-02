import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateUserUseCase } from './createUser.usecase';
import { User, UserRole } from '../domain/user.entity';
import { CreateUserDto } from '../gateways/controllers/dtos/create.dto';

jest.mock('src/common/uuid', () => ({
  newId: jest.fn(() => 'fixed-uuid-123'),
}));

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockHashService: any;
  let mockUserRepository: any;

  const mockUserDto: CreateUserDto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: UserRole.BASIC,
  };

  beforeEach(async () => {
    mockHashService = {
      hashPassword: jest.fn().mockReturnValue('hashed-pwd-123'),
    };

    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: 'HashServiceInterface',
          useValue: mockHashService,
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a new user successfully', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...mockUserDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    const result = await useCase.execute(mockUserDto);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUserDto.email);
    expect(mockHashService.hashPassword).toHaveBeenCalledWith(mockUserDto.password);
    expect(mockUserRepository.create).toHaveBeenCalled();
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should check if email already exists', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      id: 'existing-id',
      ...mockUserDto,
      passwordHash: 'hash',
      createdAt: new Date(),
    });

    await expect(useCase.execute(mockUserDto)).rejects.toThrow(ConflictException);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUserDto.email);
  });

  it('should throw ConflictException with correct message', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      id: 'existing-id',
      ...mockUserDto,
      passwordHash: 'hash',
      createdAt: new Date(),
    });

    await expect(useCase.execute(mockUserDto)).rejects.toThrow('Email already in use');
  });

  it('should not create user if email exists', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({
      id: 'existing',
      ...mockUserDto,
      passwordHash: 'hash',
      createdAt: new Date(),
    });

    try {
      await useCase.execute(mockUserDto);
    } catch (e) {
      // Expected
    }

    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it('should hash the password', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...mockUserDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    await useCase.execute(mockUserDto);

    expect(mockHashService.hashPassword).toHaveBeenCalledWith(mockUserDto.password);
  });

  it('should not return passwordHash in response', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...mockUserDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    const result = await useCase.execute(mockUserDto);

    expect(result).not.toHaveProperty('passwordHash');
    expect(Object.keys(result)).not.toContain('passwordHash');
  });

  it('should set role to BASIC if not specified', async () => {
    const dtoWithoutRole = { name: 'User', email: 'user@test.com', password: 'pass' };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      name: dtoWithoutRole.name,
      email: dtoWithoutRole.email,
      passwordHash: 'hashed',
      role: UserRole.BASIC,
      createdAt: new Date(),
    });

    const result = await useCase.execute(dtoWithoutRole as CreateUserDto);

    expect(result.role).toBe(UserRole.BASIC);
  });

  it('should create user with ADMIN role', async () => {
    const adminDto = { ...mockUserDto, role: UserRole.ADMIN };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...adminDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    const result = await useCase.execute(adminDto);

    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('should create user with MODERATOR role', async () => {
    const modDto = { ...mockUserDto, role: UserRole.MODERATOR };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...modDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    const result = await useCase.execute(modDto);

    expect(result.role).toBe(UserRole.MODERATOR);
  });

  it('should return created user data', async () => {
    const createdDate = new Date();
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      name: mockUserDto.name,
      email: mockUserDto.email,
      passwordHash: 'hashed-pwd-123',
      role: mockUserDto.role,
      createdAt: createdDate,
    });

    const result = await useCase.execute(mockUserDto);

    expect(result).toEqual({
      id: 'fixed-uuid-123',
      name: mockUserDto.name,
      email: mockUserDto.email,
      role: mockUserDto.role,
      createdAt: createdDate,
    });
  });

  it('should create multiple users with different emails', async () => {
    const user1Dto = { ...mockUserDto, email: 'user1@test.com' };
    const user2Dto = { ...mockUserDto, email: 'user2@test.com' };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValueOnce({
      id: 'fixed-uuid-123',
      ...user1Dto,
      passwordHash: 'hashed',
      createdAt: new Date(),
    });
    mockUserRepository.create.mockResolvedValueOnce({
      id: 'fixed-uuid-123',
      ...user2Dto,
      passwordHash: 'hashed',
      createdAt: new Date(),
    });

    const result1 = await useCase.execute(user1Dto);
    const result2 = await useCase.execute(user2Dto);

    expect(result1.email).toBe('user1@test.com');
    expect(result2.email).toBe('user2@test.com');
    expect(mockUserRepository.create).toHaveBeenCalledTimes(2);
  });

  it('should pass correct data to repository.create', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...mockUserDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    await useCase.execute(mockUserDto);

    const createCall = mockUserRepository.create.mock.calls[0][0];
    expect(createCall).toEqual({
      id: 'fixed-uuid-123',
      name: mockUserDto.name,
      email: mockUserDto.email,
      passwordHash: 'hashed-pwd-123',
      role: mockUserDto.role,
      createdAt: expect.any(Date),
    });
  });

  it('should set createdAt to current date', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    const beforeCreate = new Date();
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...mockUserDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    await useCase.execute(mockUserDto);

    const createCall = mockUserRepository.create.mock.calls[0][0];
    expect(createCall.createdAt.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime()
    );
  });

  it('should handle user with long name', async () => {
    const longNameDto = {
      ...mockUserDto,
      name: 'A'.repeat(100),
    };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...longNameDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    const result = await useCase.execute(longNameDto);

    expect(result.name).toBe('A'.repeat(100));
  });

  it('should handle user with numeric password', async () => {
    const numericPasswordDto = {
      ...mockUserDto,
      password: '12345678901234567890',
    };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...mockUserDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    await useCase.execute(numericPasswordDto);

    expect(mockHashService.hashPassword).toHaveBeenCalledWith(
      numericPasswordDto.password
    );
  });

  it('should verify email check happens before password hashing', async () => {
    const callOrder: string[] = [];

    mockUserRepository.findByEmail.mockImplementation(() => {
      callOrder.push('findByEmail');
      return Promise.resolve(null);
    });

    mockHashService.hashPassword.mockImplementation(() => {
      callOrder.push('hashPassword');
      return 'hashed';
    });

    mockUserRepository.create.mockImplementation(() => {
      callOrder.push('create');
      return Promise.resolve({
        id: 'fixed-uuid-123',
        ...mockUserDto,
        passwordHash: 'hashed',
        createdAt: new Date(),
      });
    });

    await useCase.execute(mockUserDto);

    expect(callOrder.indexOf('findByEmail')).toBeLessThan(
      callOrder.indexOf('hashPassword')
    );
  });

  it('should preserve all user fields in response', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      name: mockUserDto.name,
      email: mockUserDto.email,
      passwordHash: 'hashed-pwd-123',
      role: mockUserDto.role,
      createdAt: new Date(),
    });

    const result = await useCase.execute(mockUserDto);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('createdAt');
  });

  it('should handle special characters in email', async () => {
    const specialEmailDto = {
      ...mockUserDto,
      email: 'test+tag@example.com',
    };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 'fixed-uuid-123',
      ...specialEmailDto,
      passwordHash: 'hashed-pwd-123',
      createdAt: new Date(),
    });

    await useCase.execute(specialEmailDto);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      specialEmailDto.email
    );
  });
});
