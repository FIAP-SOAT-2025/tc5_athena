import { Body, Controller, Post,Logger } from '@nestjs/common';
import { AuthUseCase } from '../../usecases/auth.usecase';
import { CredentialsDto } from './dtos/credentials.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { AuthRefreshTokenUseCase } from 'src/auth/usecases/authRefreshToken.usecase';


@Controller('auth')
export class AuthController {
     private readonly logger = new Logger(AuthController.name);   
    constructor(private readonly authUseCase: AuthUseCase, 
        private readonly authRefreshTokenUseCase: AuthRefreshTokenUseCase,
    ) {}

    @Post('signin')
    async signIn(@Body() credentials: CredentialsDto) {
        
        const { email, password } = credentials;
         this.logger.log(`[AuthController.signIn] Received sign-in request with email:${email}`);
        return this.authUseCase.signIn(email, password);
    }

    @Post('refresh')
    async refresh(@Body() body: RefreshTokenDto) {
    return this.authRefreshTokenUseCase.refreshToken(body.refresh_token);
}
}
