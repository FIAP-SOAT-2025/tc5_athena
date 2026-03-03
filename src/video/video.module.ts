import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { VideoController } from './gateways/controllers/video.controller';
import { VideoProcessorUseCase } from './usecases/videoProcessor.usecase';
import { dbConection } from '../database/dbConection';
import { PrismaVideoRepository } from './gateways/repository/video.repository';
import { FileStorageUseCase } from './usecases/fileStorage.usecase';
import { ValidateFileUseCase } from './usecases/validateFile.usecase';
import { StorageModule } from '../storage/storage.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    StorageModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [VideoController],
  providers: [
    VideoProcessorUseCase,
    FileStorageUseCase,
    ValidateFileUseCase,
    PrismaVideoRepository,
    dbConection,
  ],
})
export class VideoModule {}
