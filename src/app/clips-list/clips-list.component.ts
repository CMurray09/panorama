import { Component, OnInit } from '@angular/core';
import {ClipService} from "../services/clip.service";

@Component({
  selector: 'app-clips-list',
  templateUrl: './clips-list.component.html',
  styleUrls: ['./clips-list.component.css']
})
export class ClipsListComponent implements OnInit {

  constructor(public imageService: ClipService) {
    this.imageService.getClips();
  }

  async ngOnInit(): Promise<void> {}

}
