import { Test, TestingModule } from '@nestjs/testing';
import { AuthUseCase } from './auth.usecase';
import { UserRepositoryInterface } from 'src/users/gateways/interfaces/user.repository.interface';
import { UserRole } from 'src/users/domain/user.entity';
import { HashServiceInterface } from 'src/users/gateways/interfaces/hash.service.interface';


describe('AuthUseCase', () => {
  let service: AuthUseCase;
  let userRepository : UserRepositoryInterface;
  let hashService: HashServiceInterface;
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
          useValue: { sign: jest.fn() },
        },],
    }).compile();

    service = module.get<AuthUseCase>(AuthUseCase);
    userRepository = module.get<UserRepositoryInterface>('UserRepositoryInterface')
    hashService = module.get<HashServiceInterface>('HashServiceInterface')
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a token on successful sign in', async () => {
     const mockUser = { 
      id:'5a9a127b-fda3-4888-8f0e-f040416708f5',
      name:'Teste Name',
      email:'teste@gmail.com', 
      passwordHash: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
      role: UserRole.ADMIN,
      createdAt: new Date(),
    }

    const password ='1234567890' 
     jest.spyOn(userRepository,'findByUserEmail').mockResolvedValue(mockUser)
     jest.spyOn(hashService,'compare').mockReturnValue(true)
     
     const result = await service.signIn( password , mockUser.email);
     console.log("DENTRO DO TESTE:::", result)
  });


});
