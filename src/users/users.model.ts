import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './usecases/createUser.usecase';
import { GetUserUseCase } from './usecases/getUser.usecase';
import { HashService } from './gateways/security/hash.security';
import { UserController } from './gateways/controllers/user.controller';
import { PrismaUserRepository } from './gateways/repository/user.repository';
import { dbConection } from '../database/dbConection';

@Module({
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    GetUserUseCase,
    dbConection,
    {
      provide: 'UserRepositoryInterface',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'HashServiceInterface',
      useClass: HashService,
    }
  ],
  exports: [dbConection, 'HashServiceInterface','UserRepositoryInterface'],
})
export class UsersModule {}