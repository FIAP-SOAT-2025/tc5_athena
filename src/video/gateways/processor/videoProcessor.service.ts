import { Injectable } from '@nestjs/common';
import { VideoProcessorInterface } from '../videoProcessor';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import archiver from 'archiver';


@Injectable()
export class VideoProcessorService implements VideoProcessorInterface {
    constructor() {
        ffmpeg.setFfmpegPath(ffmpegPath.path);
    }

    async extractFrames(filePath: string, outputDir: string): Promise<void> {
        if(!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .fps(1)
                .output(`${outputDir}/frame-%03d.png`)
                .on('end', () => {
                    resolve();
                })
                .on('error', (err) => {
                    reject(err);
                })
                .run();
        });
    }

    async compressFrames(framesDir: string, outputDir: string): Promise<void> {
        const output = fs.createWriteStream(outputDir);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                resolve();
            });
            archive.on('error', (err) => {
                reject(err);
            });
            archive.pipe(output);
            archive.directory(framesDir, false);
            archive.finalize();
        });
    }
}   