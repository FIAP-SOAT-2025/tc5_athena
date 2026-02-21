import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
export class CredentialsDto {
    
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    @IsString()
    password: string;
}