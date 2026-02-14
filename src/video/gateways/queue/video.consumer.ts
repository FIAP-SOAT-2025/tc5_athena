import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import type { VideoConsumerInterface } from "../video.consumer.interface";
import type { VideoProcessorInterface } from "../videoProcessor";
import { Inject } from "@nestjs/common";
import * as fs from 'fs';

@Processor('video-processing')
export class VideoConsumer extends WorkerHost implements VideoConsumerInterface {
    
    constructor(
        @Inject('VideoProcessorInterface')
        private readonly videoProcessor: VideoProcessorInterface
    ) {
        super();
    }
    
    async process(job: Job<any>): Promise<any> {
        const { videoPath, timestamp } = job.data;
        const tempDir = `./temp/${timestamp}`;
        const zipPath = `./outputs/frames_${timestamp}.zip`;

        try {
            await job.updateProgress(10);
            await this.videoProcessor.extractFrames(videoPath, tempDir);

            await job.updateProgress(60);
            await this.videoProcessor.compressFrames(tempDir, zipPath);

            await job.updateProgress(100);
            await fs.promises.rm(tempDir, { recursive: true, force: true });

            return { 'fileName': `frames_${timestamp}.zip`, 'path': zipPath };
        } catch (error) {
            throw new Error(`Erro no processamento do vídeo: ${error.message}`);
        }
    }
}