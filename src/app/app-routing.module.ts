import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocumentationComponent } from './documentation/documentation.component';
import { ConversationComponent } from './api-rtc/api-rtc.module';
import { ApiRestComponent } from './api-rest/api-rest.module';

const routes: Routes = [
  { path: 'conversation', component: ConversationComponent },
  { path: 'conversation/:name', component: ConversationComponent },
  { path: 'doc', component: DocumentationComponent },
  { path: 'apirest', component: ApiRestComponent },
  { path: '', redirectTo: '/conversation', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
