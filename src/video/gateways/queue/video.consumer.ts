import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import type { VideoConsumerInterface } from "../video.consumer.interface";
import type { VideoProcessorInterface } from "../videoProcessor";
import { Inject } from "@nestjs/common";
import * as fs from 'fs';
import { VideoStatus } from "../../domain/video.entity";
import { PrismaVideoRepository } from "../repository/video.repository";
@Processor('video-processing')
export class VideoConsumer extends WorkerHost implements VideoConsumerInterface {
    
    constructor(
        @Inject('VideoProcessorInterface')
        private readonly videoProcessor: VideoProcessorInterface,
        private readonly videoRepository: PrismaVideoRepository
    ) {
        super();
    }
    
    async process(job: Job<any>): Promise<any> {
        const { videoPath, timestamp, videoId } = job.data;
        const tempDir = `./temp/${timestamp}`;
        const zipPath = `./outputs/frames_${timestamp}.zip`;

        try {    
            await this.videoRepository.updateStatus(videoId, VideoStatus.PROCESSING);
            
            await job.updateProgress(10);
            await this.videoProcessor.extractFrames(videoPath, tempDir);

            await job.updateProgress(60);
            await this.videoProcessor.compressFrames(tempDir, zipPath);

            await job.updateProgress(100);
            await fs.promises.rm(tempDir, { recursive: true, force: true });
            await this.videoRepository.updateStatus(videoId, VideoStatus.COMPLETED);
            return { 'fileName': `frames_${timestamp}.zip`, 'path': zipPath };
        } catch (error) {
            await this.videoRepository.updateStatus(videoId, VideoStatus.ERROR);
            throw new Error(`Erro no processamento do vídeo: ${error.message}`);
        }
    }
}