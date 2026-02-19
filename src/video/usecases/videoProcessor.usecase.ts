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

            const newVideo: Video = {
                id: randomUUID(),
                size: parseInt(createVideoDto.size || '1') || 1,
                file_name: createVideoDto.file_name || '',
                extension: file.mimetype ||'',
                status: VideoStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: createVideoDto.userId || ''
            };

            await this.videoRepository.create(newVideo);
            
            // const timestamp = Date.now();
            // const filePath = `${process.cwd()}/uploads/${timestamp}_${file.originalname}`;



            // const tempDir = `${process.cwd()}/temp/${timestamp}`;
            // const zipPath = `${process.cwd()}/outputs/frames_${timestamp}.zip`;

            // await fs.promises.writeFile(filePath, file.buffer);

            // await this.videoProcessor.extractFrames(filePath, tempDir);
            // await this.videoProcessor.compressFrames(tempDir, zipPath);

            // await fs.promises.rm(tempDir, { recursive: true, force: true });

            // return { 'fileName': `frames_${timestamp}.zip`, 'path': zipPath };

            // const timestamp = Date.now();
            // const filePath = `${process.cwd()}/uploads/${timestamp}_${file.originalname}`;

            // await fs.promises.writeFile(filePath, file.buffer);

            // const job = await this.videoQueue.add('extract-frames', {
            //     videoPath: filePath,
            //     timestamp: timestamp,
            //     originalName: file.originalname
            // }, {
            //     attempts: 3,
            //     backoff: { type: 'exponential', delay: 1000 }
            // });
            
            return { jobId: 1 , status: 'Processing' };
        } catch (error) {
            throw error;
        }
    }
}