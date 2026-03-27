import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return ok status', () => {
    const result = controller.check();
    expect(result).toEqual({ status: 'ok' });
  });

  it('should have status property', () => {
    const result = controller.check();
    expect(result).toHaveProperty('status');
  });

  it('should have status value as ok string', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });
});
