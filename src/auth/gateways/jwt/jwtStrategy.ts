import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaUserRepository } from "src/users/gateways/repository/user.repository";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userRepository: PrismaUserRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: any) {
        console.log(`[JwtStrategy.validate] Validating JWT for email: ${payload.email}`);
        const emailExists = await this.userRepository.findByUserEmail(payload.email);
        console.log(`[JwtStrategy.validate] User found: ${emailExists ? emailExists.email : 'No user found'}`);
        if (!emailExists) {
            console.error(`[JwtStrategy.validate] User not found for email: ${payload.email}`);
            throw new UnauthorizedException();
        }
        return { userId: emailExists.id, email: emailExists.email };
    }
}
