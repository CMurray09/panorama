import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask} from "@angular/fire/compat/storage";
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import firebase from 'firebase/compat/app';
import {ClipService} from "src/app/services/clip.service";
import {Router} from '@angular/router';
import {forkJoin, switchMap} from 'rxjs';
import Image from "../../models/clip.model";
import {DocumentReference} from "@angular/fire/compat/firestore";
import {FfmpegService} from "../../services/ffmpeg.service";
import {NgxFileDropEntry} from "ngx-file-drop";

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
  imageType: string = 'image/png';

  images: Array<string> = [];

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

  author = new FormControl('', {
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

  checkFileValid(droppedFile: any) {
    let invalid = true;
    if (droppedFile.fileEntry.isFile) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file(async (file: File) => {
        if (!file.type.includes('image/')) {
          this.showAlert = true;
          this.alertMsg = 'The dropped file is not an image'
          return;
        }
        this.formData.append('logo', file, droppedFile.relativePath);
        this.totalFileCount++;
        this.isMediaDropped = true;

        // File check passed. Add to file array
        invalid = false;
        this.files.push(file);
        this.imageType = file.type;
        this.screenshots.push(await this.ffmpegService.getScreenshot(file));
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
    if (files.length > 1) {
      this.showAlert = true;
      this.alertMsg = 'You cannot upload more than one file at once.';
      this.files = [];
      return;
    }

    for (const droppedFile of files) {
       if (this.checkFileValid(droppedFile)) {
         return;
       }
      this.showAlert = false;
      this.isMediaDropped = true;
    }
  }

  async uploadFile(): Promise<void> {
    this.mediaForm.disable();
    this.showAlert = true;
    this.alertColour = 'blue';
    this.alertMsg = 'Please wait! Your clip is being uploaded.';
    this.inSubmission = true;
    this.showPercentage = true;
    const title: string = this.title.value;
    const author: string = this.author.value;
    const clipFileName: string = uuidv4();

    const screenshotBlob: Blob = await this.ffmpegService.blobFromURL(
      this.screenshots[0]
    );
    const screenshotPath: string = `screenshots/${clipFileName}.${this.imageType}`;

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);
    const screenshotRef: AngularFireStorageReference = this.storage.ref(screenshotPath);

      this.screenshotTask.percentageChanges().subscribe((progress) => {
      const screenshotProgress: number | undefined = progress;
      if (!screenshotProgress) {
        return;
      }
      this.percentage = screenshotProgress as number / 100;
    });

    forkJoin([
      this.screenshotTask.snapshotChanges()
    ]).pipe(
      switchMap(() => forkJoin([
        screenshotRef.getDownloadURL()
      ]))
    ).subscribe({
      next: async (urls) => {
        const screenshotURL: any = urls;
        const clip: Image = {
          uid: this.user?.uid as string,
          displayName: author ? author : this.user?.displayName as string,
          title,
          fileName: `${clipFileName}.jpg`,
          url: screenshotURL,
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
