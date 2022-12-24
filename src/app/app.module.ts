import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {UserModule} from "./user/user.module";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFireModule } from "@angular/fire/compat";
import { environment } from "src/environments/environment";
import {AngularFireAuthModule} from "@angular/fire/compat/auth";
import {AngularFirestoreModule} from "@angular/fire/compat/firestore";
import {AngularFireStorageModule} from "@angular/fire/compat/storage";
import { ToastrModule } from "ngx-toastr";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ImageViewerComponent} from "./image-viewer/image-viewer.component";
import {ClipComponent} from "./clip/clip.component";
import {NotFoundComponent} from "./not-found/not-found.component";
import {ClipsListComponent} from "./clips-list/clips-list.component";
import {FbTimestampPipe} from "./pipes/fb-timestamp.pipe";
import {NavComponent} from "./nav/nav.component";
import { PannellumComponent } from './pannellum/pannellum.component';
import {SharedModule} from "./shared/shared.module";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    ImageViewerComponent,
    ClipComponent,
    NotFoundComponent,
    ClipsListComponent,
    FbTimestampPipe,
    PannellumComponent
  ],
  imports: [
    BrowserModule,
    UserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AppRoutingModule,
    AngularFireStorageModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-center',
      preventDuplicates: true
    }),
    SharedModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
