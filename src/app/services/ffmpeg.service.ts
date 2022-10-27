import { Injectable } from '@angular/core';
import {createFFmpeg, FFmpeg} from '@ffmpeg/ffmpeg';
import {NgxFileDropEntry} from "ngx-file-drop";

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

  async createBlob(file: NgxFileDropEntry) {
    const imageBlob: Blob = new Blob([file.relativePath]);
    const imageURL: string = URL.createObjectURL(imageBlob);
    return imageURL;
  }

  async blobFromURL(url: string): Promise<Blob> {
    const response = await fetch(url);
    return await response.blob();
  }
}
