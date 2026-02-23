import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import type { UserRepositoryInterface } from '../gateways/interfaces/user.repository.interface';

@Injectable()
export class GetUserUseCase {

  constructor(
    @Inject('UserRepositoryInterface') 
    private readonly userRepository: UserRepositoryInterface
  ) {}

  async execute(identifier: string): Promise<User> {
    return (await this.userRepository.findByEmailOrId(identifier)) as User;
  }
}
