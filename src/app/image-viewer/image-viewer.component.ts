import { Component, OnInit } from '@angular/core';
import {ClipService} from "../services/clip.service";

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.css']
})
export class ImageViewerComponent implements OnInit {

  constructor(public imageService: ClipService) {
    this.imageService.getClips();
  }

  async ngOnInit(): Promise<void> {
  }

}
