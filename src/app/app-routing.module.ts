import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ImageViewerComponent} from "./image-viewer/image-viewer.component";
import {NotFoundComponent} from "./not-found/not-found/not-found.component";

const routes: Routes = [
  {
    path: '',
    component: ImageViewerComponent
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
