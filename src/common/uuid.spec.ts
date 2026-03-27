import { newId } from './uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('UUID Utility', () => {
  it('should generate a UUID', () => {
    const id = newId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('should return a string from v4', () => {
    const id = newId();
    expect(id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should be a valid UUID format', () => {
    const id = newId();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });
});

