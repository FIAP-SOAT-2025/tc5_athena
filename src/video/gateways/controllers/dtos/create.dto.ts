import { IsNotEmpty, IsString, IsInt, IsEnum, IsOptional } from 'class-validator';

export enum VideoStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR'
}

export class CreateVideoDto {

    @IsNotEmpty()
    @IsString()
    size: string;

    @IsNotEmpty()
    @IsString()
    file_name: string;
    
    @IsOptional()
    @IsString()
    extension: string;

    @IsOptional()
    @IsEnum(VideoStatus)
    status?: VideoStatus;

    @IsNotEmpty()
    @IsString()
    userId: string;
}
