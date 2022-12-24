import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClipComponent } from "./clip/clip.component";
import {NotFoundComponent} from "./not-found/not-found.component";
import { ClipService } from "./services/clip.service";
import {ImageViewerComponent} from "./image-viewer/image-viewer.component";
import {PannellumComponent} from "./pannellum/pannellum.component";

const routes: Routes = [
  {
    path: '',
    component: ImageViewerComponent
  },
  {
    path: 'image/:id',
    component: ClipComponent,
    resolve: {
      clip: ClipService
    }
  },
  {
    path: 'pannellum/:id',
    component: PannellumComponent,
    resolve: {
      clip: ClipService
    }
  },
  {
    path: '',
    loadChildren: async () => (await import('./media/media.module')).MediaModule
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
