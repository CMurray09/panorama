import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MediaRoutingModule } from './media-routing.module';
import { ManageComponent } from './manage/manage.component';
import { UploadComponent } from './upload/upload.component';
import {SharedModule} from "../shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";
import { EditComponent } from './edit/edit.component';
import { SafeURLPipe } from './pipes/safe-url.pipe';
import { DeleteComponent } from './delete/delete.component';
import {NgxFileDropModule} from "ngx-file-drop";


@NgModule({
  declarations: [
    ManageComponent,
    UploadComponent,
    EditComponent,
    SafeURLPipe,
    DeleteComponent
  ],
  imports: [
    CommonModule,
    MediaRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    NgxFileDropModule
  ]
})
export class MediaModule { }
