import { Test, TestingModule } from '@nestjs/testing';
import { AuthUseCase } from './auth.usecase';

describe('AuthUseCase', () => {
  let service: AuthUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthUseCase],
    }).compile();

    service = module.get<AuthUseCase>(AuthUseCase);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
