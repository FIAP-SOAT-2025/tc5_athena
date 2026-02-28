import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { UserRepositoryInterface } from "src/users/gateways/interfaces/user.repository.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(@Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,) {
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
