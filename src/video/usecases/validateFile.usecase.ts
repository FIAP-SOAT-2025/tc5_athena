import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Video, VideoStatus } from '../domain/video.entity';

@Injectable()
export class ValidateFileUseCase {
  constructor() {}

  validate(file: Express.Multer.File, userId: string): Video {
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo excede o limite de 30MB');
    }

    const allowedExtensions = /\.(mp4|avi|mov|mkv|wmv|flv|webm)$/;
    if (!allowedExtensions.test(file.originalname)) {
      throw new BadRequestException('Formato de vídeo não suportado');
    }

    const fileName = file.originalname;
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1);

    const videoData: Video = {
      id: randomUUID(),
      size: file.size,
      file_name: fileName,
      extension,
      status: VideoStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId || '',
    };

    return videoData;
  }
}
