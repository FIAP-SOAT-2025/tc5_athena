import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CredentialsDto } from './credentials.dto';

describe('CredentialsDto Validation', () => {
  it('should validate correct credentials', async () => {
    const dto = plainToInstance(CredentialsDto, {
      email: 'test@example.com',
      password: 'securePassword123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when email is invalid', async () => {
    const dto = plainToInstance(CredentialsDto, {
      email: 'invalid-email',
      password: 'securePassword123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail when email is not provided', async () => {
    const dto = plainToInstance(CredentialsDto, {
      password: 'securePassword123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail when password is shorter than 8 characters', async () => {
    const dto = plainToInstance(CredentialsDto, {
      email: 'test@example.com',
      password: 'short',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail when password is not provided', async () => {
    const dto = plainToInstance(CredentialsDto, {
      email: 'test@example.com',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should accept minimum password length of 8 characters', async () => {
    const dto = plainToInstance(CredentialsDto, {
      email: 'test@example.com',
      password: '12345678', // Exactly 8 characters
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept various valid email formats', async () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.co.uk',
      'first+last@example.com',
      'test_123@example.com',
    ];

    for (const email of validEmails) {
      const dto = plainToInstance(CredentialsDto, {
        email,
        password: 'securePassword123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should reject various invalid email formats', async () => {
    const invalidEmails = [
      'plainaddress',
      '@example.com',
      'username@.com',
      'username@example',
    ];

    for (const email of invalidEmails) {
      const dto = plainToInstance(CredentialsDto, {
        email,
        password: 'securePassword123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    }
  });
});
