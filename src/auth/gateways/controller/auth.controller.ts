import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthUseCase } from '../../usecases/auth.usecase';
import { CredentialsDto } from './dtos/credentials.dto';


@Controller('auth')
export class AuthController {
    constructor(private readonly authUseCase: AuthUseCase) {}

    @Post('signin')
    async signIn(@Body() credentials: CredentialsDto) {
        
        const { email, password } = credentials;
        console.log("[AuthController.signIn] Received sign-in request with email:", email);
        return this.authUseCase.signIn(email, password);
    }
}
