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



});
