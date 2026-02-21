import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import * as fs from 'fs';
import { Queue } from "bullmq";
import { Video, VideoContext, VideoStatus } from "../domain/video.entity";
import { randomUUID } from "crypto";
import { PrismaVideoRepository } from "../gateways/repository/video.repository";

@Injectable()
export class VideoProcessorUseCase {
    constructor(
        @InjectQueue('video-processing')
        private readonly videoQueue: Queue,
        private readonly videoRepository: PrismaVideoRepository
    ) {}

    async execute(file: Express.Multer.File, createVideoDto: VideoContext) {

        try {
            const videoId = randomUUID();
            const newVideo: Video = {
                id: videoId,
                size: parseInt(createVideoDto.size || '1') || 1,
                file_name: createVideoDto.file_name || '',
                extension: file.mimetype ||'',
                status: VideoStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: createVideoDto.userId || ''
            };

            await this.videoRepository.create(newVideo);

            const timestamp = Date.now();
            const filePath = `${process.cwd()}/uploads/${timestamp}_${file.originalname}`;

            await fs.promises.writeFile(filePath, file.buffer);

            const job = await this.videoQueue.add('extract-frames', {
                videoPath: filePath,
                timestamp: timestamp,
                videoId: videoId,
                originalName: file.originalname
            }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            });
            
            return { jobId: job.id , status: 'Processing', videoId: videoId };
        } catch (error) {
            throw error;
        }
    }
}