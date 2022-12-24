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
  imageTask?: AngularFireUploadTask;

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
    private imageService: ClipService,
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
        this.images.push(await this.ffmpegService.getImage(file));
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
    this.alertMsg = 'Please wait! Your image is being uploaded.';
    this.inSubmission = true;
    this.showPercentage = true;
    const title: string = this.title.value;
    const author: string = this.author.value;
    const imageFileName: string = uuidv4();

    const imageBlob: Blob = await this.ffmpegService.blobFromURL(
      this.images[0]
    );
    const imagePath: string = `images/${imageFileName}.${this.imageType}`;

    this.imageTask = this.storage.upload(imagePath, imageBlob);
    const imageRef: AngularFireStorageReference = this.storage.ref(imagePath);

      this.imageTask.percentageChanges().subscribe((progress) => {
      const imageProgress: number | undefined = progress;
      if (!imageProgress) {
        return;
      }
      this.percentage = imageProgress as number / 100;
    });

    forkJoin([
      this.imageTask.snapshotChanges()
    ]).pipe(
      switchMap(() => forkJoin([
        imageRef.getDownloadURL()
      ]))
    ).subscribe({
      next: async (urls) => {
        const imageURL: any = urls;
        const image: Image = {
          uid: this.user?.uid as string,
          displayName: author ? author : this.user?.displayName as string,
          title,
          fileName: `${imageFileName}.jpg`,
          url: imageURL,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          pannellum: ''
        }
        const imageDocRef: DocumentReference<Image> = await this.imageService.createImage(image);
        this.alertColour = 'green';
        this.alertMsg = 'Success! Your image is now ready to share with the world.';
        this.showPercentage = false;

        setTimeout(() => {
          this.router.navigate([
            'pannellum', imageDocRef.id
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
