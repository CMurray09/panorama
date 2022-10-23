import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask} from "@angular/fire/compat/storage";
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import {switchMap} from 'rxjs/operators';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import firebase from 'firebase/compat/app';
import {ClipService} from "src/app/services/clip.service";
import {Router} from '@angular/router';
import {combineLatest, forkJoin} from 'rxjs';
import IClip from "../../models/clip.model";
import {DocumentReference} from "@angular/fire/compat/firestore";
import {FfmpegService} from "../../services/ffmpeg.service";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {
  isDragover: boolean = false;
  file: File | null = null;
  isVideoDropped: boolean = false;
  showAlert: boolean = false;
  alertColour: string = 'blue';
  alertMsg: string = 'Please wait! Your clip is being uploaded.';
  inSubmission: boolean = false;
  percentage: number = 0;
  showPercentage: boolean = false;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  screenshots: Array<string> = [];
  selectedScreenshot: string = '';
  screenshotTask?: AngularFireUploadTask;

  title = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50)
    ],
    nonNullable: true
  });

  videoForm: FormGroup = new FormGroup({
    title: this.title
  })

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipsService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService) {
    auth.user.subscribe(user => this.user = user);
    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
    this.task?.cancel();
  }

  async storeFile($event: Event): Promise<void> {
    if (this.ffmpegService.isRunning) {
      return;
    }

    this.isDragover = false;
    this.file = ($event as DragEvent).dataTransfer ?
      ($event as DragEvent).dataTransfer?.files.item(0) ?? null :
      ($event.target as HTMLInputElement).files?.item(0) ?? null;

    if (!this.file || this.file.type !== 'media/mp4') {
      return;
    }
    this.screenshots = await this.ffmpegService.getScreenshots(this.file);

    this.selectedScreenshot = this.screenshots[0];

    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
    this.isVideoDropped = true;
  }

  async uploadFile(): Promise<void> {
    this.videoForm.disable();
    this.showAlert = true;
    this.alertColour = 'blue';
    this.alertMsg = 'Please wait! Your clip is being uploaded.';
    this.inSubmission = true;
    this.showPercentage = true;
    const title: string = this.title.value;
    const clipFileName: string = uuidv4();
    const clipPath: string = `clips/${clipFileName}.mp4`;
    const screenshotBlob: Blob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    );
    const screenshotPath: string = `screenshots/${clipFileName}.png`;

    this.task = this.storage.upload(clipPath, this.file);
    const clipRef: AngularFireStorageReference = this.storage.ref(clipPath);

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);
    const screenshotRef: AngularFireStorageReference = this.storage.ref(screenshotPath);

    combineLatest([
      this.task.percentageChanges(),
      this.screenshotTask.percentageChanges()
    ]).subscribe((progress) => {
      const [clipProgress, screenshotProgress]: Array<number | undefined> = progress;
      if (!clipProgress || !screenshotProgress) {
        return;
      }
      const total: number = clipProgress + screenshotProgress;
      this.percentage = total as number / 200;
    });

    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges()
    ]).pipe(
      switchMap(() => forkJoin([
        clipRef.getDownloadURL(),
        screenshotRef.getDownloadURL()
      ]))
    ).subscribe({
      next: async (urls) => {
        const [clipURL, screenshotURL]: Array<string> = urls;
        const clip: IClip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title,
          fileName: `${clipFileName}.mp4`,
          url: clipURL,
          screenshotURL,
          screenshotFileName: `${clipFileName}.png`,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }
        const clipDocRef: DocumentReference<IClip> = await this.clipsService.createClip(clip);
        this.alertColour = 'green';
        this.alertMsg = 'Success! Your clip is now ready to share with the world.';
        this.showPercentage = false;

        setTimeout(() => {
          this.router.navigate([
            'clip', clipDocRef.id
          ])
        }, 1000)
      },
      error: (error) => {
        this.videoForm.enable();
        this.alertColour = 'red';
        this.alertMsg = 'Upload failed! Please try again later.';
        this.showPercentage = false;
        this.inSubmission = true;
        console.error(error);
      }
    });
  }
}
