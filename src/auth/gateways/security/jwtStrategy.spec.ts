import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwtStrategy';
import { UserRepositoryInterface } from 'src/users/gateways/interfaces/user.repository.interface';
import { UserRole } from 'src/users/domain/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: UserRepositoryInterface;

  const mockUser = {
    id: '5a9a127b-fda3-4888-8f0e-f040416708f5',
    name: 'Teste Name',
    email: 'teste@gmail.com',
    passwordHash: 'hashed_password',
    role: UserRole.ADMIN,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: 'UserRepositoryInterface',
          useValue: { findByUserEmail: jest.fn() },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<UserRepositoryInterface>('UserRepositoryInterface');
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return userId and email when user exists', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };

      jest.spyOn(userRepository, 'findByUserEmail').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(userRepository.findByUserEmail).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = { sub: 'some-id', email: 'nonexistent@gmail.com', role: UserRole.BASIC };

      jest.spyOn(userRepository, 'findByUserEmail').mockResolvedValue(null);

      await expect(strategy.validate(payload))
        .rejects
        .toThrow(UnauthorizedException);

      expect(userRepository.findByUserEmail).toHaveBeenCalledWith('nonexistent@gmail.com');
    });

    it('should return only userId and email, not leaking other user data', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };

      jest.spyOn(userRepository, 'findByUserEmail').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('name');
      expect(result).not.toHaveProperty('role');
      expect(Object.keys(result)).toEqual(['userId', 'email']);
    });
  });
});
