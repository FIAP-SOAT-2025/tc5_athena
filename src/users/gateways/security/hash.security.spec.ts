import { Test, TestingModule } from '@nestjs/testing';
import { HashService } from './hash.security';

describe('HashService', () => {
  let service: HashService;

  const password = 'securePassword123';
  const expectedHash = 'b8f48e8acd2f66d61e5d95b7e47b9e95cb3f8e3d5c9e5f5a5b5c5d5e5f5a5b5'; // SHA256 would generate this

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashService],
    }).compile();

    service = module.get<HashService>(HashService);
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password', () => {
      const result = service.hashPassword(password);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should generate consistent hash for same password', () => {
      const hash1 = service.hashPassword(password);
      const hash2 = service.hashPassword(password);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different passwords', () => {
      const password1 = 'password1';
      const password2 = 'password2';

      const hash1 = service.hashPassword(password1);
      const hash2 = service.hashPassword(password2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = service.hashPassword('');

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('should handle long passwords', () => {
      const longPassword = 'a'.repeat(1000);

      const hash = service.hashPassword(longPassword);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('should handle special characters', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const hash = service.hashPassword(specialPassword);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });

  describe('compare', () => {
    it('should return true for matching password and hash', () => {
      const hash = service.hashPassword(password);
      const result = service.compare(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', () => {
      const correctHash = service.hashPassword(password);
      const result = service.compare('wrongPassword', correctHash);

      expect(result).toBe(false);
    });

    it('should return false for empty password', () => {
      const hash = service.hashPassword('non-empty');
      const result = service.compare('', hash);

      expect(result).toBe(false);
    });

    it('should return true for empty password and empty hash match', () => {
      const hash = service.hashPassword('');
      const result = service.compare('', hash);

      expect(result).toBe(true);
    });

    it('should be case sensitive', () => {
      const hash = service.hashPassword('Password123');
      const result = service.compare('password123', hash);

      expect(result).toBe(false);
    });

    it('should handle special characters in password comparison', () => {
      const specialPassword = '@#$%^&*()';
      const hash = service.hashPassword(specialPassword);
      const result = service.compare(specialPassword, hash);

      expect(result).toBe(true);
    });
  });
});
