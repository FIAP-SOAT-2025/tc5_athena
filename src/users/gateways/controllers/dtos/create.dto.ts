import { IsEmail, IsNotEmpty, MinLength, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../../../domain/user.entity';

export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsEnum(UserRole)
    role: UserRole;
}