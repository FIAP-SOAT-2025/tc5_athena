import { Injectable, ConflictException,Inject } from '@nestjs/common';
import { newId } from 'src/common/uuid';
import { User, UserRole } from '../domain/user.entity';
import { CreateUserDto } from '../gateways/controllers/dtos/create.dto';
import { HashService } from '../gateways/security/hash.security';
import type { UserRepositoryInterface } from '../gateways/interfaces/user.repository.interface';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('HashServiceInterface')
    private readonly hashService: HashService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface
  ) {}

  async execute(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const emailExists = await this.userRepository.findByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException('Email already in use');
    }
    
    const newUser: User = {
      id: newId(),
      name: dto.name,
      email: dto.email,
      passwordHash: this.hashService.hashPassword(dto.password),
      role: dto.role || UserRole.BASIC,
      createdAt: new Date(),
    };

    const createdUser = await this.userRepository.create(newUser);

    const { passwordHash, ...result } = createdUser;
    return result;
  }
}