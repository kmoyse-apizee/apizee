import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocumentationComponent } from './documentation/documentation.component';
import { ApiRestComponent } from './api-rest/api-rest.module';

const routes: Routes = [
  { path: 'doc', component: DocumentationComponent },
  { path: 'apirest', component: ApiRestComponent },
  { path: '', redirectTo: '/apirest', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
