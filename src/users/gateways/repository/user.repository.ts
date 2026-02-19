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

  async findByEmail(email: string): Promise<any | null> {
    return this.orm.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<any | null> {
    return this.orm.user.findUnique({ where: { id } });
  }
}