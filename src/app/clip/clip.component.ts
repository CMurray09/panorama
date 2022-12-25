import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Image from "../models/clip.model";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-clip',
  templateUrl: './clip.component.html',
  styleUrls: ['./clip.component.css']
})
export class ClipComponent implements OnInit {
  @ViewChild('videoPlayer', { static: true }) target?: ElementRef;

  image?: Image;
  imageURL: any = '';

  constructor(public route: ActivatedRoute, private domSanitizer: DomSanitizer) {
    this.route.data.subscribe(data => {
      console.log(data);
      this.image = data['clip'] as Image;
      this.imageURL = this.domSanitizer.bypassSecurityTrustResourceUrl(this.image.pannellum);
    });
  }

  ngOnInit(): void {
  }
}
