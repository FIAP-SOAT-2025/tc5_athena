import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefreshTokenDto } from './refresh-token.dto';

describe('RefreshTokenDto Validation', () => {
  it('should validate correct refresh token', async () => {
    const dto = plainToInstance(RefreshTokenDto, {
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when refresh_token is not provided', async () => {
    const dto = plainToInstance(RefreshTokenDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('refresh_token');
  });

  it('should fail when refresh_token is empty string', async () => {
    const dto = plainToInstance(RefreshTokenDto, {
      refresh_token: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when refresh_token is not a string', async () => {
    const dto = plainToInstance(RefreshTokenDto, {
      refresh_token: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('refresh_token');
  });

  it('should accept long JWT tokens', async () => {
    const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'.repeat(10);
    const dto = plainToInstance(RefreshTokenDto, {
      refresh_token: longToken,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
