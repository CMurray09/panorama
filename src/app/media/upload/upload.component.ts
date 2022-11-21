import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask} from "@angular/fire/compat/storage";
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import firebase from 'firebase/compat/app';
import {ClipService} from "src/app/services/clip.service";
import {Router} from '@angular/router';
import {combineLatest, finalize, forkJoin, switchMap} from 'rxjs';
import Image from "../../models/clip.model";
import {DocumentReference} from "@angular/fire/compat/firestore";
import {FfmpegService} from "../../services/ffmpeg.service";
import {NgxFileDropEntry} from "ngx-file-drop";
import {FFmpeg} from "@ffmpeg/ffmpeg";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {
  isDragover: boolean = false;
  files: File[] = [];
  isMediaDropped: boolean = false;
  showAlert: boolean = false;
  alertColour: string = 'red';
  alertMsg: string = 'Please wait! Your clip is being uploaded.';
  inSubmission: boolean = false;
  percentage: number = 0;
  showPercentage: boolean = false;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  image: string = '';
  imageTask: AngularFireUploadTask | undefined;
  screenshotTask?: AngularFireUploadTask;

  screenshots: Array<string> = [];

  images: Array<string> = [];

  private ffmpeg: FFmpeg | undefined;

  currentFileCount: number = 0;
  totalFileCount: number = 0;
  formData = new FormData()


  title = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50)
    ],
    nonNullable: true
  });

  mediaForm: FormGroup = new FormGroup({
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

  checkFile(droppedFile: any) {
    let invalid = true;
    if (droppedFile.fileEntry.isFile) {
      this.showAlert = false;
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file((file: File) => {
        if (!file.type.includes('image/')) {
          this.showAlert = true;
          this.alertMsg = 'The dropped file is not an image'
          return;
        }
        this.formData.append('logo', file, droppedFile.relativePath);
        this.totalFileCount++;

        // this.title.setValue(file.name.replace(/\.[^/.]+$/, ''));
        this.isMediaDropped = true;

        // Here you can access the real file
        console.log(droppedFile.relativePath, file);

        invalid = false;

      });
    } else {
      this.showAlert = true;
      this.alertMsg = 'Something went wrong. Try again.'
      this.files = [];
      return;
    }
    return invalid;
  }


  public dropped(files: NgxFileDropEntry[]) {
    this.isMediaDropped = true;
    for (const droppedFile of files) {

      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file(async (file: File) => {
          this.files.push(file);
          this.screenshots.push(await this.ffmpegService.getScreenshot(file));

          // Here you can access the real file
          console.log(droppedFile.relativePath, file);

        })
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }

  async uploadFile(): Promise<void> {
    console.log(this.screenshots)
    this.mediaForm.disable();
    this.showAlert = true;
    this.alertColour = 'blue';
    this.alertMsg = 'Please wait! Your clip is being uploaded.';
    this.inSubmission = true;
    this.showPercentage = true;
    const title: string = this.title.value;
    const clipFileName: string = uuidv4();

    const screenshotBlob: Blob = await this.ffmpegService.blobFromURL(
      this.screenshots[0]
    );
    const screenshotPath: string = `screenshots/${clipFileName}.jpg`;
    console.log(screenshotBlob);

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);
    const screenshotRef: AngularFireStorageReference = this.storage.ref(screenshotPath);

    combineLatest([
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
      this.screenshotTask.snapshotChanges()
    ]).pipe(
      switchMap(() => forkJoin([
        screenshotRef.getDownloadURL()
      ]))
    ).subscribe({
      next: async (urls) => {
        const [clipURL, screenshotURL]: Array<string> = urls;
        const clip: Image = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title,
          fileName: `${clipFileName}.jpg`,
          url: clipURL,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }
        const clipDocRef: DocumentReference<Image> = await this.clipsService.createClip(clip);
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
        this.mediaForm.enable();
        this.alertColour = 'red';
        this.alertMsg = 'Upload failed! Please try again later.';
        this.showPercentage = false;
        this.inSubmission = true;
        console.error(error);
      }
    });
  }
}
