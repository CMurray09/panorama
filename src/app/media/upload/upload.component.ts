import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask} from "@angular/fire/compat/storage";
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import firebase from 'firebase/compat/app';
import {ClipService} from "src/app/services/clip.service";
import {Router} from '@angular/router';
import {combineLatest} from 'rxjs';
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
  file: File | null = null;
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

  currentFileCount: number = 0;
  totalFileCount: number = 0;
  formData = new FormData()


  public files: NgxFileDropEntry[] = [];

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


  public dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    this.totalFileCount = 0;
    for (const droppedFile of files) {
      // Is it a single file?
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


        });
      } else {
        this.showAlert = true;
        this.alertMsg = 'Something went wrong. Try again.'
        this.files = [];
        return;
      }
    }
    console.log(this.files.length)
  }

  async uploadFile(): Promise<void> {
    this.mediaForm.disable();
    this.showAlert = true;
    this.alertColour = 'blue';
    this.alertMsg = 'Please wait! Your clip is being uploaded.';
    this.inSubmission = true;
    this.showPercentage = true;

    for (const file of this.files) {
      const title: string = this.title.value;
      const imageFileName: string = uuidv4();
      const image: string = await this.ffmpegService.createBlob(file);
      const imageBlob: Blob = await this.ffmpegService.blobFromURL(image);
      const imagePath: string = `images/${imageFileName}.png`;

      this.imageTask = this.storage.upload(imagePath, imageBlob);
      const imageRef: AngularFireStorageReference = this.storage.ref(imagePath);

      combineLatest([
        this.imageTask.percentageChanges()
      ]).subscribe((progress) => {
        const imageProgress: any = progress;
        if (!imageProgress) {
          return;
        }
        this.percentage = imageProgress as number / 100;
      });

      imageRef.getDownloadURL().subscribe({
        next: async (url) => {
          const imageURL: string = url;
          const image: Image = {
            uid: this.user?.uid as string,
            displayName: this.user?.displayName as string,
            title,
            fileName: `${imageFileName}.png`,
            url: imageURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }
          const clipDocRef: DocumentReference<Image> = await this.clipsService.createClip(image);
          this.alertColour = 'green';
          this.alertMsg = 'Success! Your clip is now ready to share with the world.';
          this.showPercentage = false;

          setTimeout(() => {
            this.router.navigate([
              'image', clipDocRef.id
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
}
