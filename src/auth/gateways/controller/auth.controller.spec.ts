import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthUseCase } from 'src/auth/usecases/auth.usecase';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthRefreshTokenUseCase } from 'src/auth/usecases/authRefreshToken.usecase';

describe('AuthController', () => {
  let controller: AuthController;
  let authUseCase: AuthUseCase;
  let authRefreshTokenUseCase: AuthRefreshTokenUseCase;

  const credentials = {
    email: 'teste@gmail.com',
    password: '1234567890'
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{
        provide: AuthUseCase,
        useValue: {
          signIn: jest.fn().mockResolvedValue({ access_token: 'fake_token', refresh_token: 'fake_refresh_token' }),
        }
      },
      {
        provide: AuthRefreshTokenUseCase,
        useValue: {
          refreshToken: jest.fn().mockResolvedValue({  access_token: 'new_fake_token', refresh_token: 'new_fake_refresh_token' }),
        }
      },

      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authUseCase = module.get<AuthUseCase>(AuthUseCase);
    authRefreshTokenUseCase = module.get<AuthRefreshTokenUseCase>(AuthRefreshTokenUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have authUseCase injected', () => {
    expect(authUseCase).toBeDefined();
  });

  it('should have authRefreshTokenUseCase injected', () => {
    expect(authRefreshTokenUseCase).toBeDefined();
  });

  it('Should call useCase.signIn with correct datas', async () => {


    const mocktoken = { access_token: 'fake-jwt-token', refresh_token: 'fake_refresh_token' }
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);
    const result = await controller.signIn(credentials);

    expect(authUseCase.signIn).toHaveBeenCalledWith(credentials.email, credentials.password);
    expect(result).toEqual(mocktoken);
  });

  it('should throw NotFoundException when useCase throws it', async () => {

    jest.spyOn(authUseCase, 'signIn').mockRejectedValue(new NotFoundException('Email Not found'));
    await expect(controller.signIn(credentials))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should throw UnauthorizedException when useCase throws it', async () => {

    jest.spyOn(authUseCase, 'signIn').mockRejectedValue(new UnauthorizedException('Invalid password'));

    await expect(controller.signIn(credentials))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('Should call RefreshTokenUseCase.refreshToken with correct datas', async () => {
       const mocktoken = { access_token: 'fake-jwt-token', refresh_token: 'fake_refresh_token' }
      jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockResolvedValue(mocktoken);
      const result = await controller.refresh({ refresh_token: 'fake_refresh_token' });

    expect(authRefreshTokenUseCase.refreshToken).toHaveBeenCalledWith('fake_refresh_token');
    expect(result).toEqual(mocktoken);
  });

   it('should throw Invalid refresh token in refresh method', async () => {

    jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockRejectedValue(new Error('Invalid refresh token'));
    await expect(controller.refresh({ refresh_token: 'fake_refresh_token' }))
      .rejects
      .toThrow(Error('Invalid refresh token'));
  });

  it('should throw UnauthorizedException when user not found in refresh', async () => {
    jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockRejectedValue(new UnauthorizedException('Email Not found'));
    await expect(controller.refresh({ refresh_token: 'fake_refresh_token' }))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('should handle multiple signIn requests', async () => {
    const mocktoken1 = { access_token: 'token-1', refresh_token: 'refresh-1' };
    const mocktoken2 = { access_token: 'token-2', refresh_token: 'refresh-2' };

    jest.spyOn(authUseCase, 'signIn').mockResolvedValueOnce(mocktoken1);
    jest.spyOn(authUseCase, 'signIn').mockResolvedValueOnce(mocktoken2);

    const result1 = await controller.signIn(credentials);
    const result2 = await controller.signIn({ email: 'other@gmail.com', password: 'pass' });

    expect(result1.access_token).toBe('token-1');
    expect(result2.access_token).toBe('token-2');
  });

  it('should handle signIn with different passwords', async () => {
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const credentialsWithDifferentPassword = {
      email: 'test@gmail.com',
      password: 'different-password-123'
    };

    const result = await controller.signIn(credentialsWithDifferentPassword);

    expect(authUseCase.signIn).toHaveBeenCalledWith(
      credentialsWithDifferentPassword.email,
      credentialsWithDifferentPassword.password
    );
    expect(result.access_token).toBeDefined();
  });

  it('should return valid token structure from signIn', async () => {
    const mocktoken = { access_token: 'valid-jwt', refresh_token: 'valid-refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const result = await controller.signIn(credentials);

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(typeof result.access_token).toBe('string');
    expect(typeof result.refresh_token).toBe('string');
  });

  it('should handle refresh with empty token', async () => {
    jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockRejectedValue(
      new UnauthorizedException('Invalid token')
    );

    await expect(controller.refresh({ refresh_token: '' }))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('should return valid token structure from refresh', async () => {
    const mocktoken = { access_token: 'new-jwt', refresh_token: 'new-refresh' };
    jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockResolvedValue(mocktoken);

    const result = await controller.refresh({ refresh_token: 'old-token' });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
  });

  it('should handle signIn with admin user', async () => {
    const adminCredentials = { email: 'admin@gmail.com', password: 'admin-pass' };
    const mocktoken = { access_token: 'admin-token', refresh_token: 'admin-refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const result = await controller.signIn(adminCredentials);

    expect(authUseCase.signIn).toHaveBeenCalledWith(adminCredentials.email, adminCredentials.password);
    expect(result.access_token).toBe('admin-token');
  });

  it('should handle signIn with very long email', async () => {
    const longEmailCredentials = {
      email: 'very.long.email.address.with.many.parts@example.com',
      password: 'password'
    };
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const result = await controller.signIn(longEmailCredentials);

    expect(authUseCase.signIn).toHaveBeenCalledWith(longEmailCredentials.email, longEmailCredentials.password);
  });

  it('should handle signIn with very long password', async () => {
    const longPasswordCredentials = {
      email: 'test@gmail.com',
      password: 'a'.repeat(100)
    };
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const result = await controller.signIn(longPasswordCredentials);

    expect(authUseCase.signIn).toHaveBeenCalledWith(longPasswordCredentials.email, longPasswordCredentials.password);
  });

  it('should handle multiple consecutive refresh calls', async () => {
    const mocktoken1 = { access_token: 'new-token-1', refresh_token: 'new-refresh-1' };
    const mocktoken2 = { access_token: 'new-token-2', refresh_token: 'new-refresh-2' };

    jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockResolvedValueOnce(mocktoken1);
    jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockResolvedValueOnce(mocktoken2);

    const result1 = await controller.refresh({ refresh_token: 'refresh-1' });
    const result2 = await controller.refresh({ refresh_token: 'refresh-2' });

    expect(result1.access_token).toBe('new-token-1');
    expect(result2.access_token).toBe('new-token-2');
  });

  it('should call useCase with exact credentials', async () => {
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    const signInSpy = jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const testCredentials = { email: 'specific@test.com', password: 'specific-pass-123' };
    await controller.signIn(testCredentials);

    expect(signInSpy).toHaveBeenCalledWith('specific@test.com', 'specific-pass-123');
    expect(signInSpy).toHaveBeenCalledTimes(1);
  });

  it('should call refreshToken useCase with exact token', async () => {
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    const refreshSpy = jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockResolvedValue(mocktoken);

    const specificToken = 'specific-refresh-token-xyz';
    await controller.refresh({ refresh_token: specificToken });

    expect(refreshSpy).toHaveBeenCalledWith(specificToken);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException with correct message', async () => {
    const errorMessage = 'User email not found';
    jest.spyOn(authUseCase, 'signIn').mockRejectedValue(new NotFoundException(errorMessage));

    await expect(controller.signIn(credentials))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should throw UnauthorizedException with correct message', async () => {
    const errorMessage = 'Password is incorrect';
    jest.spyOn(authUseCase, 'signIn').mockRejectedValue(new UnauthorizedException(errorMessage));

    await expect(controller.signIn(credentials))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('should handle refresh token expiration error', async () => {
    const expError = new UnauthorizedException('Refresh token expired');
    jest.spyOn(authRefreshTokenUseCase, 'refreshToken').mockRejectedValue(expError);

    await expect(controller.refresh({ refresh_token: 'expired-token' }))
      .rejects
      .toThrow(UnauthorizedException);
  });

  it('should handle different email formats in signIn', async () => {
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const emailFormats = [
      'simple@example.com',
      'name.surname@example.co.uk',
      'user+tag@example.com'
    ];

    for (const email of emailFormats) {
      await controller.signIn({ email, password: 'pass' });
    }

    expect(authUseCase.signIn).toHaveBeenCalledTimes(3);
  });

  it('should respond with access_token in correct format', async () => {
    const mocktoken = { access_token: 'Bearer eyJhbGc', refresh_token: 'long-refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const result = await controller.signIn(credentials);

    expect(result.access_token).toContain('Bearer');
  });

  it('should maintain token consistency across calls', async () => {
    const token = 'consistent-token-xyz';
    const mocktoken = { access_token: token, refresh_token: 'refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    const result1 = await controller.signIn(credentials);
    const result2 = await controller.signIn(credentials);

    expect(result1.access_token).toBe(result2.access_token);
  });

  it('should handle signIn with numerical password content', async () => {
    const numericCredentials = { email: 'test@gmail.com', password: '12345678901234567890' };
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    await controller.signIn(numericCredentials);

    expect(authUseCase.signIn).toHaveBeenCalledWith(numericCredentials.email, numericCredentials.password);
  });

  it('should handle signIn with special characters in password', async () => {
    const specialCredentials = { email: 'test@gmail.com', password: '!@#$%^&*()' };
    const mocktoken = { access_token: 'token', refresh_token: 'refresh' };
    jest.spyOn(authUseCase, 'signIn').mockResolvedValue(mocktoken);

    await controller.signIn(specialCredentials);

    expect(authUseCase.signIn).toHaveBeenCalledWith(specialCredentials.email, specialCredentials.password);
  });

});
