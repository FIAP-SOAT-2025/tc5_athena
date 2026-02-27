import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from './user.repository';
import { dbConection } from '../../../database/dbConection';
import { User, UserRole } from '../../domain/user.entity';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let mockPrisma: any;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    role: UserRole.BASIC,
    createdAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
    userRole: 'BASIC',
    createdAt: mockUser.createdAt,
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        {
          provide: dbConection,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.create(mockUser);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: mockUser.name,
          email: mockUser.email,
          passwordHash: mockUser.passwordHash,
          userRole: 'BASIC',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create user with ADMIN role', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      mockPrisma.user.create.mockResolvedValue(adminUser);

      await repository.create(adminUser);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: adminUser.name,
          email: adminUser.email,
          passwordHash: adminUser.passwordHash,
          userRole: 'ADMIN',
        },
      });
    });
  });

  describe('findByUserEmail', () => {
    it('should find user by email with password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByUserEmail(mockUser.email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserEmail('non-existent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithoutPassword);

      const result = await repository.findByEmail(mockUser.email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
        select: {
          id: true,
          name: true,
          email: true,
          userRole: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('non-existent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrId', () => {
    it('should find user by email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUserWithoutPassword);

      const result = await repository.findByEmailOrId(mockUser.email);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: mockUser.email }, { id: mockUser.email }],
        },
        select: {
          id: true,
          name: true,
          email: true,
          userRole: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should find user by id', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUserWithoutPassword);

      const result = await repository.findByEmailOrId(mockUser.id);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: mockUser.id }, { id: mockUser.id }],
        },
        select: {
          id: true,
          name: true,
          email: true,
          userRole: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmailOrId('non-existent');

      expect(result).toBeNull();
    });
  });
});
