import { Test, TestingModule } from '@nestjs/testing';
import { UserRepositoryInterface } from 'src/users/gateways/interfaces/user.repository.interface';
import { TokenServiceInterface } from '../gateways/interfaces/token.service.interface';
import { AuthRefreshTokenUseCase } from './authRefreshToken.usecase';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { jwtBodyDTO } from '../gateways/controller/dtos/jwtBody.dto';
import { UserRole } from 'src/users/domain/user.entity';

describe('AuthRefreshTokenUseCase', () => {
    let useCase: AuthRefreshTokenUseCase;
    let userRepository : UserRepositoryInterface;
    let tokenService: TokenServiceInterface;
     
      beforeEach(async () => {
        
        
        const module: TestingModule = await Test.createTestingModule({
          providers: [AuthRefreshTokenUseCase,
            {
              provide: 'UserRepositoryInterface',
              useValue: { findByUserEmail: jest.fn() },
            },
            {
              provide: 'TokenServiceInterface',
              useValue: { 
                sign: jest.fn().mockReturnValue('new_fake_access_token'),
                signRefresh: jest.fn().mockReturnValue('new_fake_refresh_token'),
                verifyRefresh: jest.fn(),
              },
            },],
        }).compile();
    
        useCase = module.get<AuthRefreshTokenUseCase>(AuthRefreshTokenUseCase);
        userRepository = module.get<UserRepositoryInterface>('UserRepositoryInterface');
        tokenService = module.get<TokenServiceInterface>('TokenServiceInterface')
      });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

     it('should return a refresh token on successful method refreshToken', async () => {
        const mockPayload: jwtBodyDTO = {
            sub: '5a9a127b-fda3-4888-8f0e-f040416708f5',
            email: 'teste@gmail.com',
            role: UserRole.ADMIN,
        };

        const mockUser = {
            id: '5a9a127b-fda3-4888-8f0e-f040416708f5',
            name: 'Teste Name',
            email: 'teste@gmail.com',
            passwordHash: 'hashed_password',
            role: UserRole.ADMIN,
            createdAt: new Date(),
        };

        jest.spyOn(tokenService, 'verifyRefresh').mockReturnValue(mockPayload);
        jest.spyOn(userRepository, 'findByUserEmail').mockResolvedValue(mockUser);

        const result = await useCase.refreshToken('fake_refresh_token');

        expect(tokenService.verifyRefresh).toHaveBeenCalledWith('fake_refresh_token');
        expect(userRepository.findByUserEmail).toHaveBeenCalledWith(mockPayload.email);
        expect(tokenService.sign).toHaveBeenCalledWith({
            sub: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
        });
        expect(tokenService.signRefresh).toHaveBeenCalledWith({
            sub: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
        });
        expect(result).toEqual({
            access_token: 'new_fake_access_token',
            refresh_token: 'new_fake_refresh_token',
        });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
        const mockPayload: jwtBodyDTO = {
            sub: '5a9a127b-fda3-4888-8f0e-f040416708f5',
            email: 'deleted@gmail.com',
            role: UserRole.ADMIN,
        };

        jest.spyOn(tokenService, 'verifyRefresh').mockReturnValue(mockPayload);
        jest.spyOn(userRepository, 'findByUserEmail').mockResolvedValue(null);

        await expect(useCase.refreshToken('fake_refresh_token'))
            .rejects
            .toThrow(UnauthorizedException);

        expect(tokenService.verifyRefresh).toHaveBeenCalledWith('fake_refresh_token');
        expect(userRepository.findByUserEmail).toHaveBeenCalledWith(mockPayload.email);
        expect(tokenService.sign).not.toHaveBeenCalled();
        expect(tokenService.signRefresh).not.toHaveBeenCalled();
    });

    it('should throw Error when refresh token is invalid', async () => {
        jest.spyOn(tokenService, 'verifyRefresh').mockImplementation(() => {
            throw new Error('invalid signature');
        });

        await expect(useCase.refreshToken('invalid_token'))
            .rejects
            .toThrow('Invalid refresh token');

        expect(tokenService.verifyRefresh).toHaveBeenCalledWith('invalid_token');
        expect(userRepository.findByUserEmail).not.toHaveBeenCalled();
        expect(tokenService.sign).not.toHaveBeenCalled();
        expect(tokenService.signRefresh).not.toHaveBeenCalled();
    });

    it('should throw Error when refresh token is expired', async () => {
        jest.spyOn(tokenService, 'verifyRefresh').mockImplementation(() => {
            throw new Error('jwt expired');
        });

        await expect(useCase.refreshToken('expired_token'))
            .rejects
            .toThrow('Invalid refresh token');

        expect(tokenService.verifyRefresh).toHaveBeenCalledWith('expired_token');
        expect(userRepository.findByUserEmail).not.toHaveBeenCalled();
    });

    it('should propagate error when repository throws unexpected error', async () => {
        const mockPayload: jwtBodyDTO = {
            sub: '5a9a127b-fda3-4888-8f0e-f040416708f5',
            email: 'teste@gmail.com',
            role: UserRole.ADMIN,
        };

        jest.spyOn(tokenService, 'verifyRefresh').mockReturnValue(mockPayload);
        jest.spyOn(userRepository, 'findByUserEmail').mockRejectedValue(
            new Error('Database connection lost'),
        );

        await expect(useCase.refreshToken('fake_refresh_token'))
            .rejects
            .toThrow('Invalid refresh token');

        expect(tokenService.verifyRefresh).toHaveBeenCalledWith('fake_refresh_token');
        expect(userRepository.findByUserEmail).toHaveBeenCalledWith(mockPayload.email);
        expect(tokenService.sign).not.toHaveBeenCalled();
    });

    

});