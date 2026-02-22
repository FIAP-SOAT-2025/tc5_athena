import {
  UseGuards,
  BadRequestException,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Param,
  Body,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Request } from '@nestjs/common';

import { VideoProcessorUseCase } from '../../usecases/videoProcessor.usecase';
import { JwtAuthGuard } from 'src/auth/gateways/jwt/jwtAuth.guard';
import { FileStorageUseCase } from 'src/video/usecases/fileStorage.usecase';
import { ValidateFileUseCase } from 'src/video/usecases/validateFile.usecase';

@Controller('video')
@ApiBearerAuth()
export class VideoController {
  private readonly logger = new Logger(VideoController.name);
  private readonly outputFileName: string;

  constructor(
    private readonly videoProcessorUseCase: VideoProcessorUseCase,
    private readonly fileStorageUseCase: FileStorageUseCase,
    private readonly validateFileUseCase: ValidateFileUseCase,
    @InjectQueue('video-processing')
    private readonly videoQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.outputFileName = this.configService.get<string>(
      'OUTPUT_FILE_NAME',
      'output.zip',
    );
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    description: 'Upload de vídeo',
    type: 'multipart/form-data',
  })
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { userId: string; email: string } },
  ) {
    const { userId } = req.user;
    this.logger.log(
      `Upload requested by user ${userId}, file: ${file.originalname}`,
    );
    const video = this.validateFileUseCase.validate(file, userId);

    await this.fileStorageUseCase.storeFile(video, file);
    this.logger.log(`File stored, videoId: ${video.id}`);

    const result = await this.videoProcessorUseCase.process(video);
    this.logger.log(`Processing queued, jobId: ${result.jobId}`);
    return result;
  }

  @Get('status/:jobId')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Param('jobId') jobId: string) {
    this.logger.log(`Status check for jobId: ${jobId}`);
    const job = await this.videoQueue.getJob(jobId);

    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      throw new NotFoundException('Processamento não encontrado');
    }

    const state = await job.getState(); // 'waiting', 'active', 'completed', 'failed'
    const progress = job.progress;
    const result = job.returnvalue;
    const reason = job.failedReason;

    return {
      id: job.id,
      state,
      progress: `${progress}%`,
      result: state === 'completed' ? result : null,
      error: state === 'failed' ? reason : null,
    };
  }

  @Get(':userId/:videoId')
  @UseGuards(JwtAuthGuard)
  async getVideo(
    @Param('userId') userId: string,
    @Param('videoId') videoId: string,
    @Res() res: Response,
  ) {
    const key = `${userId}/${videoId}/${this.outputFileName}`;
    this.logger.log(`Download requested for key: ${key}`);

    const file = await this.fileStorageUseCase.getFile(key);
    if (!file.body) {
      this.logger.warn(`File not found: ${key}`);
      throw new NotFoundException('Arquivo não encontrado');
    }

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${this.outputFileName}"`,
      'Content-Length': file.body.length,
    });

    res.send(file.body);
  }
}
