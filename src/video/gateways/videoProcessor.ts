export interface VideoProcessorInterface {
    extractFrames(filePath: string, outputDir: string): Promise<void>;
    compressFrames(framesDir: string, outputDir: string): Promise<void>;
}