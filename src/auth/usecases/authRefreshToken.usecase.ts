import { Inject, UnauthorizedException } from "@nestjs/common";
import type { UserRepositoryInterface } from "src/users/gateways/interfaces/user.repository.interface";
import type { TokenServiceInterface } from "../gateways/interfaces/token.service.interface";
import { jwtBodyDTO } from "../gateways/controller/dtos/jwtBody.dto";

export class AuthRefreshTokenUseCase {
    constructor(
        @Inject('UserRepositoryInterface')
                private readonly userRepository: UserRepositoryInterface,
        @Inject('TokenServiceInterface')
                private readonly jwtService: TokenServiceInterface
    ) { }

    async refreshToken(refreshToken: string): Promise<{ access_token: string, refresh_token: string }> {
        let payload: jwtBodyDTO;
        
        try {
            payload = this.jwtService.verifyRefresh(refreshToken);
            console.log("[AuthRefreshTokenUseCase.refreshToken] Refresh token payload:", payload);
            
        

            const user = await this.userRepository.findByUserEmail(payload.email);
            if (!user) {
                throw new UnauthorizedException('Email Not found');
            }

            const jwtBody: jwtBodyDTO = { sub: user.id, email: user.email, role: user.role };

            return {
                access_token: this.jwtService.sign(jwtBody),
                refresh_token: this.jwtService.signRefresh(jwtBody),
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error; 
            }
            throw new Error('Invalid refresh token');
        }    



    }
}