import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ClipService} from "../services/clip.service";
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-pannellum',
  templateUrl: './pannellum.component.html',
  styleUrls: ['./pannellum.component.css']
})
export class PannellumComponent implements OnInit {
  imageURL: string | undefined;
  image: any;

  constructor(
    public route: ActivatedRoute,
    private imageService: ClipService,
    private clipboard: Clipboard) { }

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
      // this.clipboard.writeText(this.imageURL);
    }
  }

}
