import { jwtBodyDTO } from "../controller/dtos/jwtBody.dto";

export interface TokenServiceInterface {
    sign(payload: jwtBodyDTO): string;
}