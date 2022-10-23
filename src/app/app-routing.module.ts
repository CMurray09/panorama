import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClipComponent } from "./clip/clip.component";
import {NotFoundComponent} from "./not-found/not-found.component";
import { ClipService } from "./services/clip.service";
import {ImageViewerComponent} from "./image-viewer/image-viewer.component";

const routes: Routes = [
  {
    path: '',
    component: ImageViewerComponent
  },
  {
    path: 'clip/:id',
    component: ClipComponent,
    resolve: {
      clip: ClipService
    }
  },
  {
    path: '',
    loadChildren: async () => (await import('./media/video.module')).VideoModule
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
