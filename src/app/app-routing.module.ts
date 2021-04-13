import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocumentationComponent } from './documentation/documentation.component';
import { OneToOneComponent, ConversationComponent } from './api-rtc/api-rtc.module';
import { ApiRestComponent } from './api-rest/api-rest.module';

const routes: Routes = [
  { path: 'conversation', component: ConversationComponent },
  { path: 'conversation/:convname', component: ConversationComponent },
  { path: 'doc', component: DocumentationComponent },
  { path: 'onetoone', component: OneToOneComponent },
  { path: 'apirest', component: ApiRestComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
