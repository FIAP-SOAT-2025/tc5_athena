import { dbConection } from './dbConection';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('dbConection', () => {
  let connection: dbConection;

  beforeEach(() => {
    connection = new dbConection();
  });

  it('should be defined', () => {
    expect(connection).toBeDefined();
  });

  it('should have $connect method', () => {
    expect(connection.$connect).toBeDefined();
    expect(typeof connection.$connect).toBe('function');
  });

  it('should have $disconnect method', () => {
    expect(connection.$disconnect).toBeDefined();
    expect(typeof connection.$disconnect).toBe('function');
  });

  it('should call $connect on module init', async () => {
    const connectSpy = jest.spyOn(connection, '$connect');
    await connection.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should call $disconnect on module destroy', async () => {
    const disconnectSpy = jest.spyOn(connection, '$disconnect');
    await connection.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
