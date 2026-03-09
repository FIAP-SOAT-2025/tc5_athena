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
        const emailExists = await this.userRepository.findByUserEmail(payload.email);
        if (!emailExists) {
            throw new UnauthorizedException();
        }
        return { 
            userId: emailExists.id, 
            email: emailExists.email, 
            name: emailExists.name 
        };
    }
}
