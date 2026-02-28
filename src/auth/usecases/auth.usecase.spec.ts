import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthUseCase } from './auth.usecase';
import { UserRepositoryInterface } from 'src/users/gateways/interfaces/user.repository.interface';
import { UserRole } from 'src/users/domain/user.entity';
import { HashServiceInterface } from 'src/users/gateways/interfaces/hash.service.interface';
import { TokenServiceInterface } from '../gateways/interfaces/token.service.interface';


describe('AuthUseCase', () => {
  let service: AuthUseCase;
  let userRepository : UserRepositoryInterface;
  let hashService: HashServiceInterface;
  let tokenService: TokenServiceInterface;
  let mockUser = { 
      id:'5a9a127b-fda3-4888-8f0e-f040416708f5',
      name:'Teste Name',
      email:'teste@gmail.com', 
      passwordHash: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
      role: UserRole.ADMIN,
      createdAt: new Date(),
  };

  const password ='1234567890'
  
  beforeEach(async () => {
    
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthUseCase,{
          provide: 'HashServiceInterface',
          useValue: { hashPassword: jest.fn(), compare: jest.fn() },
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: { findByUserEmail: jest.fn() },
        },
        {
          provide: 'TokenServiceInterface',
          useValue: { sign: jest.fn().mockReturnValue('fake-jwt-token'),
                      signRefresh: jest.fn().mockReturnValue('fake-refresh-token')
           },
        },],
    }).compile();

    service = module.get<AuthUseCase>(AuthUseCase);
    userRepository = module.get<UserRepositoryInterface>('UserRepositoryInterface');
    hashService = module.get<HashServiceInterface>('HashServiceInterface');
    tokenService = module.get<TokenServiceInterface>('TokenServiceInterface')
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a token on successful sign in', async () => {
     

    
     jest.spyOn(userRepository,'findByUserEmail').mockResolvedValue(mockUser);
     jest.spyOn(hashService,'compare').mockReturnValue(true);
     
     const result = await service.signIn(  mockUser.email, password);

     expect(result).toEqual({ access_token: 'fake-jwt-token',refresh_token: 'fake-refresh-token' });
     expect(userRepository.findByUserEmail).toHaveBeenCalledWith(mockUser.email);
     expect(hashService.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
     expect(tokenService.sign).toHaveBeenCalledWith({
            sub: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
          });
  });

  it("Should return erro case user not found", async()=>{

    jest.spyOn(userRepository,'findByUserEmail').mockResolvedValue(null);
   
    await expect(service.signIn(  mockUser.email, password)).rejects.toThrow(NotFoundException);
    await expect(service.signIn(mockUser.email, password))
      .rejects.toThrow(new NotFoundException('Email Not found'));
    expect(hashService.compare).not.toHaveBeenCalled();
    expect(tokenService.sign).not.toHaveBeenCalled();

  });

  it("Should return erro if the password is incorrect", async()=>{
      jest.spyOn(userRepository,'findByUserEmail').mockResolvedValue(mockUser);
      jest.spyOn(hashService,'compare').mockReturnValue(false);

      await expect(service.signIn(  mockUser.email, password)).rejects.toThrow(UnauthorizedException);
      expect(hashService.compare).toHaveBeenCalledTimes(1);
      await expect(service.signIn(mockUser.email, password))
      .rejects.toThrow(new UnauthorizedException('Invalid password')); 
      expect(tokenService.sign).not.toHaveBeenCalled();

  });

});
