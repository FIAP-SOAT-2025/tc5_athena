import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { UserRepositoryInterface } from 'src/users/gateways/interfaces/user.repository.interface';
import type { TokenServiceInterface } from '../gateways/interfaces/token.service.interface';
import { jwtBodyDTO } from '../gateways/controller/dtos/jwtBody.dto';
import type { HashServiceInterface } from 'src/users/gateways/interfaces/hash.service.interface';


@Injectable()
export class AuthUseCase {
    constructor(
        @Inject('HashServiceInterface')
        private readonly hashService: HashServiceInterface,
        @Inject('UserRepositoryInterface')
        private readonly userRepository: UserRepositoryInterface,
        @Inject('TokenServiceInterface')
        private readonly jwtService: TokenServiceInterface
   ) {}

    async signIn(email: string, password: string): Promise<{ access_token: string, refresh_token: string }> {
        const emailExists = await this.userRepository.findByUserEmail(email);
        
        if (!emailExists) {
            throw new NotFoundException('Email Not found');
        }

        const passwordMatches = await this.hashService.compare(password, emailExists.passwordHash);
        
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid password');
        }
        
        const jwtBody: jwtBodyDTO = { sub: emailExists.id, email: emailExists.email, role: emailExists.role };

        
        
        return {
            access_token: this.jwtService.sign(jwtBody),
            refresh_token: this.jwtService.signRefresh(jwtBody),
        };
    }
}
