import { Injectable } from '@angular/core';
import {createFFmpeg, fetchFile, FFmpeg} from '@ffmpeg/ffmpeg';

@Injectable({
  providedIn: 'root'
})
export class FfmpegService {
  isRunning: boolean = false;
  isReady: boolean = false;
  private ffmpeg: FFmpeg;

  constructor() {
    this.ffmpeg = createFFmpeg({ log: true });
  }

  async init(): Promise<void> {
    if (this.isReady) {
      return;
    }

    await this.ffmpeg.load();
    this.isReady = true;
  }

  async getScreenshots(file: File): Promise<string[]> {
    this.isRunning = true;
    const data: Uint8Array = await fetchFile(file);
    this.ffmpeg.FS('writeFile', file.name, data);

    const seconds: Array<number> = [1,2,3];
    const commands: Array<string> = [];
    seconds.forEach(second => {
      commands.push(
        // Input
        '-i', file.name,
        // Output Options
        '-ss', `00:00:0${second}`,
        '-frames:v', '1',
        '-filter:v', 'scale=510:-1',
        // Output
        `output_0${second}.png`
      )
    });

    await this.ffmpeg.run(
      ...commands
    );

    const screenshots: Array<string> = [];
    seconds.forEach(second => {
      const screenshotFile: Uint8Array = this.ffmpeg.FS(
        'readFile', `output_0${second}.png`
      )
      const screenshotBlob: Blob = new Blob(
        [screenshotFile.buffer], {
          type: 'image/png'
        }
      );
      const screenshotURL: string = URL.createObjectURL(screenshotBlob);
      screenshots.push(screenshotURL);
    });
    this.isRunning = false;
    return screenshots;
  }

  async blobFromURL(url: string): Promise<Blob> {
    const response = await fetch(url);
    return await response.blob();
  }
}
