
import { Injectable, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../domain/user.entity';
import { CreateUserDto } from '../gateways/controllers/dtos/create.dto';
import { HashService } from '../gateways/security/hash.security';
import { PrismaUserRepository } from '../gateways/repository/user.repository';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly hashService: HashService, private readonly userRepository: PrismaUserRepository) {}

  async execute(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const emailExists = await this.userRepository.findByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException('Email already in use');
    }
    
    const newUser: User = {
      id: uuidv4(),
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