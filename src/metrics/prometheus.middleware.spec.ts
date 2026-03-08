import { Test, TestingModule } from '@nestjs/testing';
import { MetricsMiddleware } from './prometheus.middleware';
import { Request, Response, NextFunction } from 'express';

describe('MetricsMiddleware', () => {
  let middleware: MetricsMiddleware;
  let mockCounter: any;
  let mockHistogram: any;

  beforeEach(async () => {
    mockCounter = {
      inc: jest.fn(),
    };

    mockHistogram = {
      observe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsMiddleware,
        {
          provide: 'http_requests_total',
          useValue: mockCounter,
        },
        {
          provide: 'http_request_duration_seconds',
          useValue: mockHistogram,
        },
      ],
    }).compile();

    middleware = module.get<MetricsMiddleware>(MetricsMiddleware);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next function', (done) => {
    const mockReq = { method: 'GET', path: '/test' } as any;
    const mockRes = { statusCode: 200, on: jest.fn() } as any;
    const mockNext: NextFunction = () => {
      done();
    };

    middleware.use(mockReq, mockRes, mockNext);
  });

  it('should increment counter on response finish', (done) => {
    let finishHandler: Function;

    const mockReq = {
      method: 'GET',
      path: '/test',
    } as any;

    const mockRes = {
      statusCode: 200,
      on: jest.fn((event, handler) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      }),
    } as any;

    const mockNext: NextFunction = () => {
      if (finishHandler) {
        finishHandler();
        expect(mockCounter.inc).toHaveBeenCalled();
        done();
      }
    };

    middleware.use(mockReq, mockRes, mockNext);
  });
});
