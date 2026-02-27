import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetUserUseCase } from './getUser.usecase';
import { UserRepositoryInterface } from '../gateways/interfaces/user.repository.interface';
import { User, UserRole } from '../domain/user.entity';

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;

  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.BASIC,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findById: jest.fn(),
            findByEmailOrId: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetUserUseCase>(GetUserUseCase);
    userRepository = module.get('UserRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return user by identifier', async () => {
    userRepository.findByEmailOrId.mockResolvedValue({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      createdAt: mockUser.createdAt,
    });

    const result = await useCase.execute(mockUser.id);

    expect(userRepository.findByEmailOrId).toHaveBeenCalledWith(mockUser.id);
    expect(result).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      createdAt: mockUser.createdAt,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should throw NotFoundException when user not found', async () => {
    userRepository.findByEmailOrId.mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeNull();
  });

  it('should find user by email', async () => {
    userRepository.findByEmailOrId.mockResolvedValue({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      createdAt: mockUser.createdAt,
    });

    const result = await useCase.execute(mockUser.email);

    expect(userRepository.findByEmailOrId).toHaveBeenCalledWith(mockUser.email);
    expect(result.email).toBe(mockUser.email);
  });

  it('should return user with ADMIN role', async () => {
    const adminUser = {
      id: 'admin-123',
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: 'hashed-password',
      role: UserRole.ADMIN,
      createdAt: new Date(),
    };

    userRepository.findByEmailOrId.mockResolvedValue({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      createdAt: adminUser.createdAt,
    });

    const result = await useCase.execute(adminUser.id);

    expect(result.role).toBe(UserRole.ADMIN);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should return user with MODERATOR role', async () => {
    const moderatorUser = {
      id: 'mod-123',
      name: 'Moderator User',
      email: 'mod@example.com',
      passwordHash: 'hashed-password',
      role: UserRole.MODERATOR,
      createdAt: new Date(),
    };

    userRepository.findByEmailOrId.mockResolvedValue({
      id: moderatorUser.id,
      name: moderatorUser.name,
      email: moderatorUser.email,
      role: moderatorUser.role,
      createdAt: moderatorUser.createdAt,
    });

    const result = await useCase.execute(moderatorUser.id);

    expect(result.role).toBe(UserRole.MODERATOR);
  });

  it('should exclude passwordHash property from response', async () => {
    userRepository.findByEmailOrId.mockResolvedValue({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      createdAt: mockUser.createdAt,
    });

    const result = await useCase.execute(mockUser.id);

    expect(result).not.toHaveProperty('passwordHash');
    expect(Object.keys(result)).not.toContain('passwordHash');
  });

  it('should handle multiple consecutive calls', async () => {
    const user1 = {
      id: 'user-1',
      name: 'User One',
      email: 'user1@example.com',
      role: UserRole.BASIC,
      createdAt: new Date(),
    };

    const user2 = {
      id: 'user-2',
      name: 'User Two',
      email: 'user2@example.com',
      role: UserRole.BASIC,
      createdAt: new Date(),
    };

    userRepository.findByEmailOrId.mockResolvedValueOnce(user1);
    userRepository.findByEmailOrId.mockResolvedValueOnce(user2);

    const result1 = await useCase.execute('user-1');
    const result2 = await useCase.execute('user-2');

    expect(result1.id).toBe('user-1');
    expect(result2.id).toBe('user-2');
    expect(userRepository.findByEmailOrId).toHaveBeenCalledTimes(2);
  });

  it('should preserve all user properties except passwordHash', async () => {
    const userWithProperties = {
      id: 'user-with-props',
      name: 'Test User Full',
      email: 'test.full@example.com',
      role: UserRole.BASIC,
      createdAt: new Date('2024-01-15'),
    };

    userRepository.findByEmailOrId.mockResolvedValue(userWithProperties);

    const result = await useCase.execute('user-with-props');

    expect(result.id).toBe(userWithProperties.id);
    expect(result.name).toBe(userWithProperties.name);
    expect(result.email).toBe(userWithProperties.email);
    expect(result.role).toBe(userWithProperties.role);
    expect(result.createdAt).toEqual(userWithProperties.createdAt);
  });

  it('should return null when repository returns null', async () => {
    userRepository.findByEmailOrId.mockResolvedValue(null);

    const result = await useCase.execute('any-id');

    expect(result).toBeNull();
    expect(userRepository.findByEmailOrId).toHaveBeenCalledWith('any-id');
  });

  it('should call repository with exact identifier provided', async () => {
    const testId = 'specific-test-id-123';
    userRepository.findByEmailOrId.mockResolvedValue(null);

    await useCase.execute(testId);

    expect(userRepository.findByEmailOrId).toHaveBeenCalledWith(testId);
    expect(userRepository.findByEmailOrId).toHaveBeenCalledTimes(1);
  });
});
