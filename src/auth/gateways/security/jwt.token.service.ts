import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TokenServiceInterface } from '../interfaces/token.service.interface';
import { jwtBodyDTO } from '../controller/dtos/jwtBody.dto';

@Injectable()
export class JwtTokenService implements TokenServiceInterface {
    constructor(private readonly jwtService: JwtService) {}

    sign(payload:jwtBodyDTO): string {
        return this.jwtService.sign(payload);
    }

}