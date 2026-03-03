// Mock uuid before importing anything that uses it
jest.mock('src/common/uuid', () => ({
  newId: jest.fn(() => 'test-uuid-123'),
}));

import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  const mockGetUserUseCase = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUserUseCase.execute.mockClear();
    mockGetUserUseCase.execute.mockClear();

    controller = new UserController(
      mockCreateUserUseCase as any,
      mockGetUserUseCase as any,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createUserUseCase.execute with valid DTO', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'Test User',
        role: 'user',
      };

      const expectedResult = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      mockCreateUserUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(createUserDto);
      expect(mockCreateUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should return created user with all properties', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'complexPass789',
        name: 'New User',
        role: 'admin',
      };

      const expectedResult = {
        id: 'uuid-456',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'admin',
        createdAt: new Date(),
      };

      mockCreateUserUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(result.id).toBeDefined();
      expect(result.email).toBe('newuser@example.com');
      expect(result.name).toBe('New User');
      expect(result.role).toBe('admin');
    });

    it('should handle create user with minimum required fields', async () => {
      const createUserDto = {
        email: 'min@test.com',
        password: 'pass123',
        name: 'Minimal',
        role: 'user',
      };

      mockCreateUserUseCase.execute.mockResolvedValue({
        id: 'uuid-789',
        ...createUserDto,
      });

      const result = await controller.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('uuid-789');
    });

    it('should propagate errors from createUserUseCase', async () => {
      const createUserDto = {
        email: 'error@test.com',
        password: 'pass123',
        name: 'Error Test',
        role: 'user',
      };

      const error = new Error('User already exists');
      mockCreateUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should handle create with different roles', async () => {
      const rolesTest = ['user', 'admin', 'moderator'];

      for (const role of rolesTest) {
        const createUserDto = {
          email: `${role}@test.com`,
          password: 'password123',
          name: `${role} User`,
          role,
        };

        mockCreateUserUseCase.execute.mockResolvedValue({
          id: `uuid-${role}`,
          ...createUserDto,
        });

        const result = await controller.create(createUserDto);

        expect(result.role).toBe(role);
      }
    });

    it('should call execute exactly once per request', async () => {
      const createUserDto = {
        email: 'once@test.com',
        password: 'pass123',
        name: 'Once',
        role: 'user',
      };

      mockCreateUserUseCase.execute.mockResolvedValue({
        id: 'uuid-test',
        ...createUserDto,
      });

      await controller.create(createUserDto);
      await controller.create(createUserDto);

      expect(mockCreateUserUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in name and email', async () => {
      const createUserDto = {
        email: 'test+tag@example.com',
        password: 'pass123',
        name: "Jean-Pierre O'Brien",
        role: 'user',
      };

      mockCreateUserUseCase.execute.mockResolvedValue({
        id: 'uuid-special',
        ...createUserDto,
      });

      const result = await controller.create(createUserDto);

      expect(result.email).toContain('+');
      expect(result.name).toContain("'");
    });

    it('should return response without password hash', async () => {
      const createUserDto = {
        email: 'nopass@test.com',
        password: 'secret123',
        name: 'No Pass',
        role: 'user',
      };

      const expectedResult = {
        id: 'uuid-nopass',
        email: 'nopass@test.com',
        name: 'No Pass',
        role: 'user',
      };

      mockCreateUserUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should call getUserUseCase.execute with identifier', async () => {
      const identifier = 'user-id-123';
      const expectedUser = {
        id: identifier,
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
      };

      mockGetUserUseCase.execute.mockResolvedValue(expectedUser);

      const result = await controller.findOne(identifier);

      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(identifier);
      expect(mockGetUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUser);
    });

    it('should return user data when identifier exists', async () => {
      const identifier = 'existing-user-id';
      const expectedUser = {
        id: identifier,
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'admin',
      };

      mockGetUserUseCase.execute.mockResolvedValue(expectedUser);

      const result = await controller.findOne(identifier);

      expect(result.id).toBe(identifier);
      expect(result.email).toBe('existing@example.com');
    });

    it('should handle email as identifier', async () => {
      const identifier = 'user@example.com';
      const expectedUser = {
        id: 'uuid-email',
        email: identifier,
        name: 'Email User',
        role: 'user',
      };

      mockGetUserUseCase.execute.mockResolvedValue(expectedUser);

      const result = await controller.findOne(identifier);

      expect(result.email).toBe(identifier);
    });

    it('should handle UUID as identifier', async () => {
      const identifier = '123e4567-e89b-12d3-a456-426614174000';
      const expectedUser = {
        id: identifier,
        email: 'uuid@example.com',
        name: 'UUID User',
        role: 'user',
      };

      mockGetUserUseCase.execute.mockResolvedValue(expectedUser);

      const result = await controller.findOne(identifier);

      expect(result.id).toBe(identifier);
    });

    it('should propagate errors from getUserUseCase', async () => {
      const identifier = 'non-existent-id';
      const error = new Error('User not found');

      mockGetUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.findOne(identifier)).rejects.toThrow(
        'User not found',
      );
    });

    it('should handle special characters in identifier', async () => {
      const identifier = 'special+chars@test.com';
      const expectedUser = {
        id: 'uuid-special',
        email: identifier,
        name: 'Special User',
        role: 'user',
      };

      mockGetUserUseCase.execute.mockResolvedValue(expectedUser);

      const result = await controller.findOne(identifier);

      expect(result.email).toBe(identifier);
    });

    it('should call findOne multiple times with different identifiers', async () => {
      const identifiers = ['id-1', 'id-2', 'id-3'];

      for (const identifier of identifiers) {
        mockGetUserUseCase.execute.mockResolvedValue({
          id: identifier,
          email: `user-${identifier}@example.com`,
          name: `User ${identifier}`,
          role: 'user',
        });

        await controller.findOne(identifier);
      }

      expect(mockGetUserUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it('should return complete user object', async () => {
      const identifier = 'complete-user';
      const expectedUser = {
        id: identifier,
        email: 'complete@example.com',
        name: 'Complete User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetUserUseCase.execute.mockResolvedValue(expectedUser);

      const result = await controller.findOne(identifier);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('role');
    });

    it('should handle case-sensitive identifier', async () => {
      const identifier = 'CaSeSenSitiveID';
      const expectedUser = {
        id: identifier,
        email: 'case@example.com',
        name: 'Case User',
        role: 'user',
      };

      mockGetUserUseCase.execute.mockResolvedValue(expectedUser);

      const result = await controller.findOne(identifier);

      expect(result.id).toBe(identifier);
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(identifier);
    });
  });

  describe('Controller Integration', () => {
    it('should have both usecase instances injected', () => {
      expect(controller['createUserUseCase']).toBeDefined();
      expect(controller['getUserUseCase']).toBeDefined();
    });

    it('should handle concurrent create and findOne', async () => {
      const createUserDto = {
        email: 'concurrent@test.com',
        password: 'pass123',
        name: 'Concurrent User',
        role: 'user',
      };

      const identifier = 'concurrent-id';

      mockCreateUserUseCase.execute.mockResolvedValue({
        id: identifier,
        ...createUserDto,
      });

      mockGetUserUseCase.execute.mockResolvedValue({
        id: identifier,
        ...createUserDto,
      });

      const [createResult, getResult] = await Promise.all([
        controller.create(createUserDto),
        controller.findOne(identifier),
      ]);

      expect(createResult.id).toBe(identifier);
      expect(getResult.id).toBe(identifier);
      expect(mockCreateUserUseCase.execute).toHaveBeenCalled();
      expect(mockGetUserUseCase.execute).toHaveBeenCalled();
    });

    it('should handle sequential operations', async () => {
      const createUserDto = {
        email: 'sequential@test.com',
        password: 'pass123',
        name: 'Sequential User',
        role: 'user',
      };

      const userId = 'seq-user-id';

      mockCreateUserUseCase.execute.mockResolvedValue({
        id: userId,
        ...createUserDto,
      });

      mockGetUserUseCase.execute.mockResolvedValue({
        id: userId,
        ...createUserDto,
      });

      const createResult = await controller.create(createUserDto);
      const getResult = await controller.findOne(createResult.id);

      expect(createResult.id).toBe(userId);
      expect(getResult.id).toBe(userId);
    });
  });
});
