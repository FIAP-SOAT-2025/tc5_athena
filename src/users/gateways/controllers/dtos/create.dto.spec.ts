import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create.dto';
import { UserRole } from '../../../domain/user.entity';

describe('CreateUserDto Validation', () => {
  it('should validate a correct DTO', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'securePassword123',
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when name is empty', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: '',
      email: 'test@example.com',
      password: 'securePassword123',
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail when name is not provided', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'securePassword123',
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail when email is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'invalid-email',
      password: 'securePassword123',
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail when email is not provided', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      password: 'securePassword123',
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail when password is shorter than 8 characters', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail when password is not provided', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail when role is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'securePassword123',
      role: 'INVALID_ROLE',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
  });

  it('should fail when role is not provided', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'securePassword123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
  });

  it('should validate with ADMIN role', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'securePassword123',
      role: UserRole.ADMIN,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept minimum password length of 8 characters', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: '12345678', // Exactly 8 characters
      role: UserRole.BASIC,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
