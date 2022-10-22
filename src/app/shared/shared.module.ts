import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input/input.component';
import { ReactiveFormsModule } from "@angular/forms";
import { NgxMaskModule } from "ngx-mask";
import { AlertComponent } from './alert/alert.component';
import { TabComponent } from './tab/tab.component';
import { TabsContainerComponent } from './tabs-container/tabs-container.component';
import { ModalComponent } from './modal/modal.component';

@NgModule({
  declarations: [
    InputComponent,
    AlertComponent,
    TabComponent,
    TabsContainerComponent,
    ModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskModule.forRoot()
  ],
  exports: [
    InputComponent,
    AlertComponent,
    TabsContainerComponent,
    TabComponent,
    ModalComponent,
  ]
})
export class SharedModule { }
