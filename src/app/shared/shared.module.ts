import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input/input.component';
import { ReactiveFormsModule } from "@angular/forms";
import { NgxMaskModule } from "ngx-mask";
import { AlertComponent } from './alert/alert.component';
import { TabComponent } from './tab/tab.component';
import { TabsContainerComponent } from './tabs-container/tabs-container.component';
import { ModalComponent } from './modal/modal.component';
import { TooltipComponent } from './tooltip/tooltip.component';

@NgModule({
  declarations: [
    InputComponent,
    AlertComponent,
    TabComponent,
    TabsContainerComponent,
    ModalComponent,
    TooltipComponent,
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
        TooltipComponent,
    ]
})
export class SharedModule { }
