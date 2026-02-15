import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { PrismaUserRepository } from '../gateways/repository/user.repository';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly userRepository: PrismaUserRepository) {}

  async execute(identifier: string): Promise<User> {
    return (await this.userRepository.findByEmailOrId(identifier)) as User;
  }
}
