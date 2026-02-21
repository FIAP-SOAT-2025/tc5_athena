import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaUserRepository } from 'src/users/gateways/repository/user.repository';
import { HashService } from 'src/users/gateways/security/hash.security';

@Injectable()
export class AuthUseCase {
    constructor(private readonly hashService: HashService,
        private readonly userRepository: PrismaUserRepository,
        private readonly jwtService: JwtService) {}

    async signIn(email: string, password: string): Promise<{ access_token: string }> {
        const emailExists = await this.userRepository.findByUserEmail(email);
        console.log("[AuthUseCase.signIn] User found for email:", emailExists);
         console.log("[AuthUseCase.signIn] User found for password:", emailExists.passwordHash);
        if (!emailExists) {
            throw new ConflictException('Email Not found');
        }

        const passwordMatches = await this.hashService.compare(password, emailExists.passwordHash);
        console.log("[AuthUseCase.signIn] Password match result:", passwordMatches);
        if (!passwordMatches) {
            throw new ConflictException('Invalid password');
        }
        
        const payload = { sub: emailExists.id, email: emailExists.email, role: emailExists.role };

        const token = {access_token: this.jwtService.sign(payload)};
        console.log("[AuthUseCase.signIn] Generated JWT token:", token);
        console.log("[AuthUseCase.signIn] type of JWT token payload:", typeof (token));

         return token;
    }
}
