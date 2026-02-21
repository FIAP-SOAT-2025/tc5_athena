import { Injectable } from '@nestjs/common';
import { dbConection } from '../../../database/dbConection';
import { userRepositoryInterface } from '../user.repository.interface';
import { User, UserRole } from '../../domain/user.entity';

@Injectable()
export class PrismaUserRepository implements userRepositoryInterface {
  constructor(private orm: dbConection) {}

  async create(user: User): Promise<any> {
    const roleMap = {
      [UserRole.ADMIN]: 'ADMIN' as const,
      [UserRole.BASIC]: 'BASIC' as const,
    };

    return this.orm.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        ...(user.role && { userRole: roleMap[user.role] }),
      },
    });
  }

  private readonly selectWithoutPassword = {
    id: true,
    name: true,
    email: true,
    userRole: true,
    createdAt: true,
  };

  async findByUserEmail(email: string): Promise<any | null> {
    const user = await this.orm.user.findUnique({
      where: { email },
    });
    console.log('[PrismaUserRepository.findByUserEmail] User found by email:', user);
    return user;
  }

  async findByEmail(email: string): Promise<any | null> {
    const user = await this.orm.user.findUnique({
      where: { email },
      select: this.selectWithoutPassword,
    });
    console.log('[UserRepository.findByEmail] User found by email:', user);
    return user;
  }

  async findByEmailOrId(identifier: string): Promise<any | null> {
    return this.orm.user.findFirst({
      where: {
        OR: [{ email: identifier }, { id: identifier }],
      },
      select: this.selectWithoutPassword,
    });
  }
}
