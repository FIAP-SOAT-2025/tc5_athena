import { Module } from '@nestjs/common';
import { AuthUseCase } from './usecases/auth.usecase';
import { AuthController } from './gateways/controller/auth.controller';
import { UsersModule } from 'src/users/users.model';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './gateways/security/jwtStrategy';
import { JwtTokenService } from './gateways/security/jwt.token.service';
import { AuthRefreshTokenUseCase } from './usecases/authRefreshToken.usecase';

@Module({
  imports: [UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '160s' },
      }),
    }),
  ],
  providers: [
    AuthUseCase,
    JwtStrategy,
    AuthRefreshTokenUseCase,
    {
      provide: 'TokenServiceInterface',
      useClass: JwtTokenService,
    },
  ],
  exports:[JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
