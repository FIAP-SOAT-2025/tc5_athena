import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.token.service';
import { jwtBodyDTO } from '../controller/dtos/jwtBody.dto';
import { UserRole } from 'src/users/domain/user.entity';


describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token_generated_with_sucessfull'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have jwtService injected', () => {
    expect(jwtService).toBeDefined();
  });

  describe('sign', () => {
    it('should call jwtService.sign with correct payload and return a token', () => {
      const payload: jwtBodyDTO = {
        sub: 'uuid-usuario',
        email: 'teste@gmail.com',
        role: UserRole.ADMIN,
      };
      const result = service.sign(payload);

      expect(jwtService.sign).toHaveBeenCalledWith(payload);
      expect(result).toBe('token_generated_with_sucessfull');
    });
  });

  describe('signRefresh', () => {
    it('should call jwtService.sign with payload, refresh secret and 7d expiration', () => {
      const payload: jwtBodyDTO = {
        sub: 'uuid-usuario',
        email: 'teste@gmail.com',
        role: UserRole.ADMIN,
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('refresh_token_gerado');
      const result = service.signRefresh(payload);

      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '4h',
      });
      expect(result).toBe('refresh_token_gerado');
    });
  });

  describe('verifyRefresh', () => {
    it('should call jwtService.verify with token and refresh secret and return payload', () => {
      const expectedPayload: jwtBodyDTO = {
        sub: 'uuid-usuario',
        email: 'teste@gmail.com',
        role: UserRole.ADMIN,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(expectedPayload as any);
      const result = service.verifyRefresh('fake_refresh_token');

      expect(jwtService.verify).toHaveBeenCalledWith('fake_refresh_token', {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      expect(result).toEqual(expectedPayload);
    });

    it('should throw when jwtService.verify throws (invalid token)', () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('invalid signature');
      });

      expect(() => service.verifyRefresh('invalid_token')).toThrow('invalid signature');
    });

    it('should throw when jwtService.verify throws (expired token)', () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => service.verifyRefresh('expired_token')).toThrow('jwt expired');
    });
  });
});