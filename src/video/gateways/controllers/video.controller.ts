import { BadRequestException, Controller, Get, Post, UploadedFile, UseInterceptors, Param, NotFoundException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Express } from 'express';
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

import { VideoProcessorUseCase } from "../../usecases/videoProcessor.usecase";

@Controller('video')
export class VideoController {
  constructor(
    private readonly videoProcessorUseCase: VideoProcessorUseCase,
    @InjectQueue('video-processing')
    private readonly videoQueue: Queue
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    const allowedExtensions = /\.(mp4|avi|mov|mkv|wmv|flv|webm)$/;
    if (!allowedExtensions.test(file.originalname)) {
      throw new BadRequestException('Formato de vídeo não suportado');
    }
    return this.videoProcessorUseCase.execute(file);
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    const job = await this.videoQueue.getJob(jobId);

    if (!job) {
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
      error: state === 'failed' ? reason : null
    };
  }
}