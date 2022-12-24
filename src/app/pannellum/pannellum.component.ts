import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ClipService} from "../services/clip.service";

@Component({
  selector: 'app-pannellum',
  templateUrl: './pannellum.component.html',
  styleUrls: ['./pannellum.component.css']
})
export class PannellumComponent implements OnInit {
  imageURL: string | undefined;
  image: any;
  showTip: boolean = false;
  uploadURL: string = '';
  errorMessage: string = '';
  error: boolean = false;

  constructor(
    public route: ActivatedRoute,
    private imageService: ClipService) { }

  async ngOnInit(): Promise<void> {
    const docID = this.route.snapshot.paramMap.get('id');
    if (!docID) {
      console.error('No docID');
      return;
    }
    this.imageService.getUploadedImage(docID).subscribe(image => {
      this.imageURL = image.data()?.url[0];
    })
  }

  copyLink() {
    if (this.imageURL){
      navigator.clipboard.writeText(this.imageURL);
      this.showTip = true;
      setTimeout(() => {
        this.showTip = false;
      }, 3000);
    }
  }

  uploadNewLink() {
    this.uploadURL = this.uploadURL.trim();
    if (!this.uploadURL) {
      this.errorMessage = 'Upload URL is required.';
      this.error = true;
      return;
    }
    if (this.uploadURL.includes('cdn.pannellum.org')) {
      this.errorMessage = 'Incorrect Pannellum URL';
      this.error = true;
      return;
    }
  }

}
