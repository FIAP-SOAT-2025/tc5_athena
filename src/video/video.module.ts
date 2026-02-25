import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from '@nestjs/bullmq';
import { VideoController } from "./gateways/controllers/video.controller";
import { VideoConsumer } from "./gateways/queue/video.consumer";
import { VideoProcessorService } from "./gateways/processor/videoProcessor.service";
import { VideoProcessorUseCase } from "./usecases/videoProcessor.usecase";
import { dbConection } from '../database/dbConection'
import { PrismaVideoRepository } from "./gateways/repository/video.repository";
@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'video-processing',
    })
  ],
  controllers: [VideoController],
    providers: [
      VideoProcessorUseCase,
      VideoConsumer,
      PrismaVideoRepository,
      {
        provide: 'VideoProcessorInterface',
        useClass: VideoProcessorService,
      },
      dbConection,
    ],
})
export class VideoModule {}