import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from '@nestjs/bullmq';
import { VideoController } from "./gateways/controllers/video.controller";
import { VideoConsumer } from "./gateways/queue/video.consumer";
import { VideoProcessorService } from "./gateways/processor/videoProcessor.service";
import { VideoProcessorUseCase } from "./usecases/videoProcessor.usecase";

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: {
        // host: process.env.REDIS_HOST,
        host: 'localhost',
        // port: parseInt(process.env.REDIS_PORT) || 6379,
        port: 6379
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
      {
        provide: 'VideoProcessorInterface',
        useClass: VideoProcessorService,
      }
    ],
})
export class VideoModule {}