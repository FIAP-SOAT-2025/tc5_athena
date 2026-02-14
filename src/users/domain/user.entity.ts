export enum UserRole {
    ADMIN = 'admin',
    BASIC = 'basic'
}

export class User {
    id: string;
    name: string
    email: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
}