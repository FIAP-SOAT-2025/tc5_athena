import { UserRole } from "src/users/domain/user.entity";

export interface jwtBodyDTO {
    sub: string;
    email: string;
    role: UserRole;
}