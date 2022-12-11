import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  AfterContentChecked} from '@angular/core';
import {ModalService} from "src/app/services/modal.service";
import IClip from "src/app/models/clip.model";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ClipService} from "src/app/services/clip.service";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, OnChanges, OnDestroy, AfterContentChecked {
  @Input() activeClip: IClip | null = null;
  @Output() update = new EventEmitter();
  inSubmission: boolean = false;
  showAlert: boolean = false;
  alertColour: string = 'blue';
  alertMsg: string = 'Please wait! Updating clip.';

  clipID = new FormControl('', {
    nonNullable: true
  });

  title = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50)
    ],
    nonNullable: true
  });

  editForm: FormGroup = new FormGroup({
    title: this.title,
    id: this.clipID
  })

  constructor(
    private modal: ModalService,
    private clipService: ClipService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.modal.register('editClip');
  }

  ngOnDestroy(): void {
    this.modal.unregister('editClip');
  }

  ngAfterContentChecked(): void {
    if (!this.modal.isModalOpen('editClip')) {
      this.showAlert = false;
    }
  }

  ngOnChanges(): void {
    if (!this.activeClip) {
      return;
    }
    this.inSubmission = false;
    this.showAlert = false;
    this.clipID.setValue(this.activeClip.docID!);
    this.title.setValue(this.activeClip.title);
  }

  async onSubmit(): Promise<void> {
    if (!this.activeClip) {
      return;
    }

    if (this.title.value === this.activeClip.title) {
      this.showAlert = true;
      this.alertColour = 'blue';
      this.alertMsg = 'Title has not been changed. Nothing to save.';
      return;
    }

    this.inSubmission = true;
    this.showAlert = true;
    this.alertColour = 'blue';
    this.alertMsg = 'Please wait! Updating clip.';

    try {
      await this.clipService.updateClip(this.clipID.value, this.title.value)
    } catch (e) {
      this.inSubmission = false;
      this.alertColour = 'red';
      this.alertMsg = 'Something went wrong. Try again later';
      console.error(e);
      return;
    }
    this.activeClip.title = this.title.value;
    this.update.emit(this.activeClip);
    this.inSubmission = false;
    this.showSuccess();
    this.modal.toggleModal('editClip');
  }

  resetTitle($event: Event): void {
    $event.preventDefault();
    this.title.setValue(this.activeClip!.title);
  }

  showSuccess(): void {
    this.toastr.success(`New clip title: ${this.title.value}`, 'Clip successfully updated!');
  }
}
