import {
  AfterContentChecked,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import IClip from "src/app/models/clip.model";
import {ClipService} from "src/app/services/clip.service";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.css']
})
export class DeleteComponent implements OnInit, OnDestroy, OnChanges, AfterContentChecked {
  @Input() activeClip: IClip | null = null;
  @Input() clips: Array<IClip> = [];
  @Output() updateVideoList = new EventEmitter();
  inSubmission = false;
  showAlert: boolean = true;
  alertMsg: string = 'Are you sure you want to delete this media?';
  alertColour: string = 'blue';
  videoTitle: string = '';

  constructor(
    private modal: ModalService,
    private clipService: ClipService,
    private toastr: ToastrService
  ) { }

  ngAfterContentChecked(): void {
    if (!this.modal.isModalOpen('deleteClip')) {
      this.showAlert = false;
    } else if (this.activeClip) {
      this.videoTitle = this.activeClip.title;
    }
  }

  ngOnInit(): void {
    this.modal.register('deleteClip');
  }

  ngOnDestroy(): void {
    this.modal.unregister('deleteClip');
  }

  ngOnChanges(): void {
    if (!this.activeClip) {
      return;
    }
    this.videoTitle = this.activeClip.title;
    this.showAlert = false;
  }

  deleteClip($event: Event): void {
    $event.preventDefault();
    if (!this.activeClip) {
      return;
    }
    this.inSubmission = true;
    try {
      this.clipService.deleteClip(this.activeClip);
    } catch (e) {
      this.inSubmission = false;
      this.alertColour = 'red';
      this.alertMsg = 'Something went wrong. Try again later';
      console.error(e);
      return;
    }
    this.showAlert = false;
    this.updateVideoList.emit($event);
    this.inSubmission = false;
    this.modal.toggleModal('deleteClip');
    this.showSuccess();
  }

  showSuccess(): void {
    this.toastr.success(this.videoTitle, 'Video Successfully Deleted!');
  }
}
