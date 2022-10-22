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
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ImageViewerComponent} from "./image-viewer/image-viewer.component";
import {NavComponent} from "./nav/nav/nav.component";

@NgModule({
  declarations: [
    AppComponent,
    ImageViewerComponent,
    NavComponent
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
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
